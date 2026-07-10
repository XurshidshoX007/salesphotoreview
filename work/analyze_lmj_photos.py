import csv
import hashlib
import json
import math
import os
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "outputs"
DATA = OUT / "lmj_30may_photo_urls.json"
IMG_DIR = ROOT / "work" / "lmj_30may_images"
SHEET_DIR = OUT / "lmj_30may_contact_sheets"
REPORT_CSV = OUT / "lmj_30may_suspicious_photos.csv"
REPORT_JSON = OUT / "lmj_30may_suspicious_photos.json"


def safe(s):
    keep = []
    for ch in str(s):
        keep.append(ch if ch.isalnum() or ch in ("-", "_") else "_")
    return "".join(keep)[:80]


def hamming(a, b):
    return bin(a ^ b).count("1")


def dhash(gray, hash_size=8):
    small = gray.resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
    arr = np.asarray(small, dtype=np.int16)
    bits = arr[:, 1:] > arr[:, :-1]
    value = 0
    for bit in bits.flatten():
        value = (value << 1) | int(bit)
    return value


def entropy(gray):
    hist = np.asarray(gray.histogram(), dtype=np.float64)
    total = hist.sum()
    if total == 0:
        return 0.0
    p = hist[hist > 0] / total
    return float(-(p * np.log2(p)).sum())


def edge_var(gray):
    arr = np.asarray(gray.resize((256, 256), Image.Resampling.LANCZOS), dtype=np.float32)
    gx = np.diff(arr, axis=1)
    gy = np.diff(arr, axis=0)
    return float(np.var(gx) + np.var(gy))


def download_one(item):
    url = item["url"]
    ext = ".jpg"
    code = safe(item["code"])
    client_id = safe(item.get("clientId") or f"idx{item['urlIndex']:04d}")
    name_hash = hashlib.sha1(url.encode("utf-8")).hexdigest()[:12]
    path = IMG_DIR / code / f"{item['urlIndex']:03d}_{client_id}_{name_hash}{ext}"
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.stat().st_size > 1000:
        return {**item, "path": str(path), "downloadError": ""}
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = resp.read()
        path.write_bytes(data)
        return {**item, "path": str(path), "downloadError": ""}
    except Exception as e:
        return {**item, "path": str(path), "downloadError": str(e)}


def analyze_one(item):
    if item.get("downloadError"):
        return {**item, "flags": ["download_error"], "score": 1, "metrics": {}}
    try:
        with Image.open(item["path"]) as im:
            im = ImageOps.exif_transpose(im).convert("RGB")
            gray = im.convert("L")
            arr = np.asarray(gray.resize((256, 256), Image.Resampling.LANCZOS), dtype=np.float32)
            mean = float(arr.mean())
            std = float(arr.std())
            dark_ratio = float((arr < 25).mean())
            bright_ratio = float((arr > 235).mean())
            ent = entropy(gray)
            ev = edge_var(gray)
            dh = dhash(gray)
            w, h = im.size
    except Exception as e:
        return {**item, "flags": ["image_open_error"], "score": 1, "metrics": {"error": str(e)}}

    flags = []
    if mean < 35 or dark_ratio > 0.78:
        flags.append("kamera_yopilgan_yoki_juda_qorongu")
    if std < 18 and ent < 4.2:
        flags.append("past_kontrast_bir_xil_rasm")
    if bright_ratio > 0.75 and std < 28:
        flags.append("juda_oq_yoki_yuvilgan")
    if ev < 80:
        flags.append("xira_fokus_yomon")
    if w < 500 or h < 500:
        flags.append("kichik_olcham")

    score = 0
    weights = {
        "kamera_yopilgan_yoki_juda_qorongu": 4,
        "past_kontrast_bir_xil_rasm": 2,
        "juda_oq_yoki_yuvilgan": 2,
        "xira_fokus_yomon": 1,
        "kichik_olcham": 1,
    }
    for flag in flags:
        score += weights.get(flag, 1)
    return {
        **item,
        "flags": flags,
        "score": score,
        "dhash": dh,
        "metrics": {
            "width": w,
            "height": h,
            "mean": round(mean, 2),
            "std": round(std, 2),
            "darkRatio": round(dark_ratio, 4),
            "brightRatio": round(bright_ratio, 4),
            "entropy": round(ent, 3),
            "edgeVar": round(ev, 2),
        },
    }


def make_sheet(items, path, title, max_items=80):
    items = items[:max_items]
    if not items:
        return
    thumb_w, thumb_h = 180, 240
    label_h = 58
    cols = 5
    rows = math.ceil(len(items) / cols)
    canvas = Image.new("RGB", (cols * thumb_w, rows * (thumb_h + label_h) + 34), "white")
    draw = ImageDraw.Draw(canvas)
    draw.text((8, 8), title, fill=(0, 0, 0))
    for idx, item in enumerate(items):
        x = (idx % cols) * thumb_w
        y = 34 + (idx // cols) * (thumb_h + label_h)
        try:
            with Image.open(item["path"]) as im:
                im = ImageOps.exif_transpose(im).convert("RGB")
                im.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
                px = x + (thumb_w - im.width) // 2
                py = y + (thumb_h - im.height) // 2
                canvas.paste(im, (px, py))
        except Exception:
            draw.rectangle((x, y, x + thumb_w - 1, y + thumb_h - 1), outline="red")
        label = f"{item['code']} #{item['urlIndex']} {item.get('client','')[:20]}\n{','.join(item['flags'])[:42]}"
        draw.text((x + 4, y + thumb_h + 3), label, fill=(0, 0, 0))
    path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(path, quality=90)


def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    flat = []
    for row in data["rows"]:
        clients = row.get("clients") or []
        urls = row.get("urls") or []
        for i, url in enumerate(urls):
            client = clients[i] if i < len(clients) else {}
            flat.append({
                "date": data.get("date"),
                "code": row.get("code"),
                "agent": row.get("agent"),
                "photoReport": row.get("photoReport"),
                "urlIndex": i + 1,
                "url": url,
                **client,
            })

    IMG_DIR.mkdir(parents=True, exist_ok=True)
    downloaded = []
    with ThreadPoolExecutor(max_workers=16) as ex:
        futures = [ex.submit(download_one, item) for item in flat]
        for fut in as_completed(futures):
            downloaded.append(fut.result())

    analyzed = [analyze_one(item) for item in downloaded]
    by_hash = {}
    for item in analyzed:
        if "dhash" in item:
            by_hash.setdefault(item["dhash"], []).append(item)
    for items in by_hash.values():
        if len(items) > 1:
            for item in items:
                item["flags"].append("aniq_takroriy_rasm")
                item["score"] += 3

    # Near-duplicate scan within the downloaded set.
    hashes = [(i, item["dhash"]) for i, item in enumerate(analyzed) if "dhash" in item]
    near = set()
    for a in range(len(hashes)):
        ia, ha = hashes[a]
        for b in range(a + 1, len(hashes)):
            ib, hb = hashes[b]
            if hamming(ha, hb) <= 4:
                near.add(ia)
                near.add(ib)
    for i in near:
        if "aniq_takroriy_rasm" not in analyzed[i]["flags"]:
            analyzed[i]["flags"].append("oxshash_takroriy_rasm")
            analyzed[i]["score"] += 2

    suspicious = sorted([x for x in analyzed if x["flags"]], key=lambda x: (-x["score"], x["code"], x["urlIndex"]))
    REPORT_JSON.write_text(json.dumps({"date": data.get("date"), "total": len(analyzed), "suspicious": suspicious}, ensure_ascii=False, indent=2), encoding="utf-8")

    headers = ["date", "code", "agent", "urlIndex", "clientId", "client", "territory", "photoCategory", "flags", "score", "photoReport", "path", "url"]
    with REPORT_CSV.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for item in suspicious:
            writer.writerow({h: ",".join(item[h]) if h == "flags" else item.get(h, "") for h in headers})

    make_sheet(suspicious, SHEET_DIR / "suspicious_auto_top80.jpg", "Automatic suspicious candidates")
    make_sheet([x for x in analyzed if x.get("score", 0) >= 3], SHEET_DIR / "high_score_candidates.jpg", "High score candidates")
    print(json.dumps({
        "downloaded": len(downloaded),
        "analyzed": len(analyzed),
        "suspicious": len(suspicious),
        "reportCsv": str(REPORT_CSV),
        "reportJson": str(REPORT_JSON),
        "sheets": str(SHEET_DIR),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

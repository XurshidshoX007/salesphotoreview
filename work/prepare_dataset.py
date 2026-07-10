import json
import hashlib
from pathlib import Path
from collections import Counter, defaultdict
import pandas as pd
import random

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "outputs"
WORK = ROOT / "work"
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

MARKS_FILE = OUT / "lmj_review_marks.json"
DATASETS_FILE = OUT / "lmj_review_datasets.json"

CANONICAL_REASONS = [
    "Ish vaqtidan tashqari olingan foto",
    "Kamera yopilgan yoki to'sib olingan foto",
    "Bitta do'kondan takroriy foto",
    "Ekrandan qayta olingan foto",
    "Katalogdan olingan rasm",
    "Faqat mahsulot rasmi",
    "Foto talabga javob bermaydi",
]

LEGACY_MAP = {
    'Ish vaqtidan keyin olingan foto': 'Ish vaqtidan tashqari olingan foto',
    'Kamerani yopib tushirilgan foto': 'Kamera yopilgan yoki to\'sib olingan foto',
    'Kamera yopilgan yoki to\'sib olingan foto': 'Kamera yopilgan yoki to\'sib olingan foto',
    '1 ta dukondan 1tadan ortiq foto qilingan (dublikat)': 'Bitta do\'kondan takroriy foto',
    'Bitta do\'kondan takroriy foto': 'Bitta do\'kondan takroriy foto',
    'Ekrandan olingan foto': 'Ekrandan qayta olingan foto',
    'Ekrandan qayta olingan foto': 'Ekrandan qayta olingan foto',
    'Katologdan tushirilgan rasm': 'Katalogdan olingan rasm',
    'Katalogdan olingan rasm': 'Katalogdan olingan rasm',
    'Katalogdan tushirilgan rasm': 'Katalogdan olingan rasm',
    'Mahsulot rasmi (Talabga javob bermaydigan foto)': 'Faqat mahsulot rasmi',
    'Faqat mahsulot rasmi': 'Faqat mahsulot rasmi',
    'Foto talabga javob bermaydi': 'Foto talabga javob bermaydi',
}

def map_reason(legacy):
    return LEGACY_MAP.get(legacy, legacy)

def load_marks():
    with open(MARKS_FILE, encoding='utf-8') as f:
        return json.load(f)

def load_all_collects():
    with open(DATASETS_FILE, encoding='utf-8') as f:
        datasets = json.load(f)['datasets']
    
    all_photos = []
    for ds in datasets:
        file_path = OUT / ds['file']
        if not file_path.exists():
            print(f"Warning: {file_path} not found")
            continue
        with open(file_path, encoding='utf-8') as f:
            data = json.load(f)
        
        brand_code = ds.get('brand', {}).get('code', 'LMJ')
        date = ds['date']
        
        for agent in data.get('agents', []):
            agent_code = agent.get('code', '')
            agent_name = agent.get('agent', '')
            urls = agent.get('urls', [])
            clients = agent.get('clients', [])
            
            for i, url in enumerate(urls):
                client = clients[i] if i < len(clients) else {}
                all_photos.append({
                    'date': date,
                    'brand': brand_code,
                    'agent_code': agent_code,
                    'agent_name': agent_name,
                    'url_index': i + 1,
                    'url': url,
                    'client_id': client.get('visualId', client.get('apiId', '')),
                    'client_name': client.get('name', ''),
                    'client_order_sum': client.get('orderSum', 0),
                    'territory': client.get('territory', ''),
                    'photo_category': client.get('photoCategory', ''),
                })
    return all_photos

def make_photo_key(date, agent_code, url_index):
    return f"{date}#{agent_code}#r{url_index}_1"

def main():
    print("Loading marks...")
    marks = load_marks()
    print(f"Loaded {len(marks)} marks")
    
    print("Loading collect data...")
    all_photos = load_all_collects()
    print(f"Loaded {len(all_photos)} photos from collect data")
    
    url_to_photo = {p['url']: p for p in all_photos}
    
    rows = []
    matched = 0
    unmatched_marks = []
    
    for mark_key, mark in marks.items():
        verdict = mark.get('verdict', '')
        reasons = [map_reason(r) for r in mark.get('reasons', [])]
        url = mark.get('url', '')
        
        photo_info = url_to_photo.get(url)
        if not photo_info:
            unmatched_marks.append(mark_key)
            continue
        
        matched += 1
        
        label_vector = [0] * 7
        for r in reasons:
            if r in CANONICAL_REASONS:
                label_vector[CANONICAL_REASONS.index(r)] = 1
        
        row = {
            'mark_key': mark_key,
            'date': photo_info['date'],
            'brand': photo_info['brand'],
            'agent_code': photo_info['agent_code'],
            'agent_name': photo_info['agent_name'],
            'url_index': photo_info['url_index'],
            'url': url,
            'client_id': photo_info['client_id'],
            'client_name': photo_info['client_name'],
            'client_order_sum': photo_info['client_order_sum'],
            'territory': photo_info['territory'],
            'photo_category': photo_info['photo_category'],
            'verdict': verdict,
            'reasons': ';'.join(reasons),
            'note': mark.get('note', ''),
            'saved_at': mark.get('savedAt', ''),
        }
        for i, reason in enumerate(CANONICAL_REASONS):
            row[f'label_{reason}'] = label_vector[i]
        
        rows.append(row)
    
    print(f"Matched: {matched} / {len(marks)} marks")
    if unmatched_marks:
        print(f"Unmatched marks (no URL in collect data): {len(unmatched_marks)}")
        for k in unmatched_marks[:10]:
            print(f"  {k}")
    
    df = pd.DataFrame(rows)
    print(f"\nTotal labeled samples: {len(df)}")
    print(f"MINUS: {(df['verdict'] == 'MINUS').sum()}")
    print(f"OK: {(df['verdict'] == 'OK').sum()}")
    
    print("\nPer-reason distribution (MINUS only):")
    minus_df = df[df['verdict'] == 'MINUS']
    for reason in CANONICAL_REASONS:
        col = f'label_{reason}'
        if col in df.columns:
            pos = minus_df[col].sum()
            total = df[col].sum()
            print(f"  {reason}: {pos} (in MINUS) / {total} (total)")
    
    df.to_csv(DATA_DIR / "labels.csv", index=False, encoding='utf-8-sig')
    print(f"\nSaved labels.csv to {DATA_DIR}")
    
    minus_indices = df[df['verdict'] == 'MINUS'].index.tolist()
    ok_indices = df[df['verdict'] == 'OK'].index.tolist()
    
    random.seed(42)
    random.shuffle(minus_indices)
    random.shuffle(ok_indices)
    
    def split_indices(indices, train=0.7, val=0.15, test=0.15):
        n = len(indices)
        n_train = int(n * train)
        n_val = int(n * val)
        return {
            'train': indices[:n_train],
            'val': indices[n_train:n_train + n_val],
            'test': indices[n_train + n_val:]
        }
    
    minus_splits = split_indices(minus_indices)
    ok_splits = split_indices(ok_indices)
    
    splits = {}
    for split_name in ['train', 'val', 'test']:
        indices = minus_splits[split_name] + ok_splits[split_name]
        random.shuffle(indices)
        splits[split_name] = indices
        print(f"{split_name}: {len(indices)} samples (minus: {len(minus_splits[split_name])}, ok: {len(ok_splits[split_name])})")
    
    with open(DATA_DIR / "splits.json", 'w', encoding='utf-8') as f:
        json.dump(splits, f, ensure_ascii=False, indent=2)
    
    meta = {
        'canonical_reasons': CANONICAL_REASONS,
        'total_samples': len(df),
        'minus_count': int((df['verdict'] == 'MINUS').sum()),
        'ok_count': int((df['verdict'] == 'OK').sum()),
        'splits': {k: len(v) for k, v in splits.items()},
        'reason_counts': {r: int(minus_df[f'label_{r}'].sum()) for r in CANONICAL_REASONS if f'label_{r}' in df.columns},
    }
    with open(DATA_DIR / "meta.json", 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    
    print(f"\nDone! Files saved to {DATA_DIR}:")
    print("  - labels.csv (full dataset)")
    print("  - splits.json (train/val/test indices)")
    print("  - meta.json (dataset metadata)")

if __name__ == '__main__':
    main()
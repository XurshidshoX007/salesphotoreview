import { createServer } from "node:http";
import { lookup } from "node:dns/promises";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import { isIP } from "node:net";
import { join, extname, normalize, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { exec, spawn } from "node:child_process";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { gzipSync } from "node:zlib";
import sharp from "sharp";
import { createApiRouter } from "../backend/src/routes/index.mjs";
import { createAuthMiddleware } from "../backend/src/middleware/auth.mjs";
import { handleRequestError } from "../backend/src/middleware/errors.mjs";
import { createAttendanceService } from "../backend/src/services/attendance.service.mjs";
import { createSalesService } from "../backend/src/services/sales.service.mjs";
import { createStorageService } from "../backend/src/services/storage.service.mjs";
import { createTelegramService } from "../backend/src/services/telegram.service.mjs";
import { BRANDS_FILE, BRANDS_SEED_FILE, findBrand, loadBrandsConfig, publicBrand, saveBrandsConfig, validateBrandsConfig } from "../scripts/brand-config.mjs";
import { buildReviewCss } from "../scripts/build-review-css.mjs";
import {
  apiError,
  isValidIsoDate,
  mapWithConcurrency,
  readJsonBody,
  readTextBody,
  sendJson,
  sleep,
} from "./lib/review-http.mjs";
import {
  FILES as ATT_FILES,
  attendanceToCsv,
  exportAttendanceCsv,
  generateAttendanceMonth,
  loadAttendanceMonth,
  loadAttendanceStore,
  replaceEmployee,
  safeWriteJson,
  saveOverride,
  validateAttendanceData,
} from "../scripts/attendance-core.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// OUTPUTS = statik kod (review-ui, HTML) — image ichida, faqat o'qish uchun.
const OUTPUTS = join(ROOT, "outputs");
// DATA_ROOT = o'zgaruvchan ma'lumotlar (marks, datasets, tabel, brendlar).
// DATA_DIR o'rnatilmasa lokalda ROOT bilan bir xil => xatti-harakat o'zgarmaydi.
// Railway'da DATA_DIR=/data (Volume) => ma'lumotlar deploy'lar orasida saqlanadi.
const DATA_ROOT = process.env.DATA_DIR ? resolve(process.env.DATA_DIR) : ROOT;
const DATA_OUTPUTS = join(DATA_ROOT, "outputs");
const MARKS_FILE = join(DATA_OUTPUTS, "lmj_review_marks.json");
const SUSPICIOUS_PHOTOS_FILE = join(DATA_OUTPUTS, "lmj_suspicious_photos.json");
const PHOTO_METRICS_FILE = join(DATA_OUTPUTS, "lmj_photo_metrics_cache.json");
const PHOTO_METRICS_LIMIT = Number(process.env.PHOTO_METRICS_LIMIT || 5000);
const REASONS_FILE = join(DATA_OUTPUTS, "lmj_review_reasons.json");
const TELEGRAM_SESSIONS_FILE = join(DATA_OUTPUTS, "lmj_telegram_review_sessions.json");
const TELEGRAM_FILE_CACHE_FILE = join(DATA_OUTPUTS, "lmj_telegram_file_cache.json");
const TELEGRAM_USAGE_STATS_FILE = join(DATA_OUTPUTS, "lmj_telegram_usage_stats.json");
const PORT = Number(process.env.PORT || 8765);
// Railway/konteynerda 0.0.0.0 ga bog'lanish shart (aks holda tashqaridan ochilmaydi).
// Muhit aniqlansa avtomatik; lokalda 127.0.0.1 (xavfsiz) qoladi.
const IS_CLOUD = Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID || process.env.RENDER || process.env.FLY_APP_NAME);
const HOST = process.env.HOST || (IS_CLOUD ? "0.0.0.0" : "127.0.0.1");
const PUBLIC_HOST = HOST === "0.0.0.0" ? "127.0.0.1" : HOST;
const REVIEW_URL = `http://${PUBLIC_HOST}:${PORT}/lmj_date_photo_review.html`;
const DEFAULT_REASONS = [
  "Ish vaqtidan tashqari olingan foto",
  "Kamera yopilgan yoki to'sib olingan foto",
  "Bitta do'kondan takroriy foto",
  "Ekrandan qayta olingan foto",
  "Katalogdan olingan rasm",
  "Faqat mahsulot rasmi",
  "Foto talabga javob bermaydi",
];
const LEGACY_REASONS = {
  "Ish vaqtidan keyin olingan foto": "Ish vaqtidan tashqari olingan foto",
  "Kamerani yopib tushirilgan foto": "Kamera yopilgan yoki to'sib olingan foto",
  "1 ta dukondan 1tadan ortiq foto qilingan (dublikat)": "Bitta do'kondan takroriy foto",
  "Ekrandan olingan foto": "Ekrandan qayta olingan foto",
  "Katologdan tushirilgan rasm": "Katalogdan olingan rasm",
  "Katalogdan tushirilgan rasm": "Katalogdan olingan rasm",
  "Mahsulot rasmi (Talabga javob bermaydigan foto)": "Faqat mahsulot rasmi",
  "Foto talabga javob bermaydi": "Foto talabga javob bermaydi",
};
const DEFAULT_PHOTO_CACHE_MAX = 1000;
const rateMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60;

function isRateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const windowMs = 60000;
  const max = 60;
  const record = rateMap.get(ip);
  if (!record) {
    rateMap.set(ip, { count: 1, start: now });
    return false;
  }
  if (now - record.start > windowMs) {
    // reset window
    rateMap.set(ip, { count: 1, start: now });
    return false;
  }
  if (record.count >= max) {
    return true;
  }
  // increment
  record.count += 1;
  rateMap.set(ip, record);
  return false;
}

const photoCache = new Map();
const photoInflight = new Map();
const photoThumbnailInflight = new Map();
const staticFileCache = new Map();
const staticGzipCache = new Map();
let marksWriteQueue = Promise.resolve();
let reasonsWriteQueue = Promise.resolve();
const PHOTO_DISK_CACHE_DIR = join(DATA_ROOT, "work", ".photo-cache");
const MAINTENANCE_SCRIPT = join(ROOT, "scripts", "maintenance-cleanup.mjs");
// Yig'ish rejimi: "http" (brauzersiz, tez, default) yoki "browser" (Playwright zaxira).
// COLLECT_MODE=browser qilib eski Chrome yo'liga qaytish mumkin.
const COLLECT_MODE = String(process.env.COLLECT_MODE || "http").trim().toLowerCase();
const COLLECT_SCRIPT = COLLECT_MODE === "browser"
  ? join(ROOT, "work", "run_collect_playwright.mjs")
  : join(ROOT, "work", "run_collect_http.mjs");
const LOGIN_SCRIPT = join(ROOT, "work", "open_sales_login.mjs");
const LOGIN_BAT = join(ROOT, "0-SALES-LOGIN-TAYYORLASH.bat");
const collectState = {
  running: false,
  startedAt: null,
  finishedAt: null,
  date: "",
  brand: "",
  status: "idle",
  awaiting: null,
  pid: null,
  exitCode: null,
  outputFile: "",
  logs: [],
};
let collectProcess = null;
let collectStopReason = "";

async function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    try {
      const text = await readFile(join(ROOT, name), "utf8");
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
        const index = trimmed.indexOf("=");
        const key = trimmed.slice(0, index).trim();
        const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
        if (key && process.env[key] === undefined) process.env[key] = value;
      }
    } catch {
      // Env file is optional.
    }
  }
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml; charset=utf-8",
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const rel = decoded.replace(/^\/+/, "");
  // Avval o'zgaruvchan ma'lumot (Volume) da qidiramiz — yig'ilgan datasetlar,
  // manifest shu yerda. Topilmasa image ichidagi statik kodga (review-ui) qaytamiz.
  const dataAbs = normalize(join(DATA_OUTPUTS, rel));
  if (dataAbs.startsWith(normalize(DATA_OUTPUTS)) && existsSync(dataAbs)) return dataAbs;
  const abs = normalize(join(OUTPUTS, rel));
  if (!abs.startsWith(normalize(OUTPUTS))) return null;
  return abs;
}

function reviewAccessToken() {
  return String(process.env.REVIEW_ACCESS_TOKEN || process.env.APP_ACCESS_TOKEN || "").trim();
}

function reviewAccessPin() {
  return String(process.env.REVIEW_ACCESS_PIN || process.env.REVIEW_ACCESS_PASSWORD || "").trim();
}

function accessSessionMaxAgeMs() {
  const hours = Number(process.env.REVIEW_ACCESS_SESSION_HOURS || 24);
  return Math.max(1, Math.min(168, hours || 24)) * 60 * 60 * 1000;
}

function accessSessionSecret() {
  return String(process.env.REVIEW_ACCESS_SESSION_SECRET || reviewAccessToken() || reviewAccessPin() || "review-access").trim();
}

function telegramSessionSecret() {
  return String(process.env.TELEGRAM_REVIEW_SESSION_SECRET || accessSessionSecret()).trim();
}

function cookieValue(req, name) {
  const cookie = String(req.headers.cookie || "");
  for (const part of cookie.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    if (key !== name) continue;
    try {
      return decodeURIComponent(part.slice(index + 1).trim());
    } catch {
      return part.slice(index + 1).trim();
    }
  }
  return "";
}

function accessCookieHeader(token) {
  return `review_access=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax`;
}

function pinSessionSignature(value) {
  return createHmac("sha256", accessSessionSecret()).update(value).digest("hex");
}

function pinSessionCookieHeader() {
  const stamp = String(Date.now());
  const value = `${stamp}.${pinSessionSignature(stamp)}`;
  const maxAge = Math.floor(accessSessionMaxAgeMs() / 1000);
  return `review_pin=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearPinSessionCookieHeader() {
  return "review_pin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
}

function hasValidPinSession(req) {
  const raw = cookieValue(req, "review_pin");
  const match = String(raw || "").match(/^(\d{10,})\.([a-f0-9]{64})$/i);
  if (!match) return false;
  const stamp = match[1];
  const age = Date.now() - Number(stamp);
  if (!Number.isFinite(age) || age < 0 || age > accessSessionMaxAgeMs()) return false;
  const expected = pinSessionSignature(stamp);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(match[2]));
  } catch {
    return false;
  }
}

function isLocalHostHeader(req) {
  const host = String(req.headers.host || "").split(":")[0].replace(/^\[|\]$/g, "").toLowerCase();
  return host === "127.0.0.1" || host === "localhost" || host === "::1";
}

function accessHeaders(parsed, req) {
  const token = reviewAccessToken();
  const pin = reviewAccessPin();
  const queryToken = parsed.searchParams.get("access") || parsed.searchParams.get("token") || "";
  const allowedByQuery = Boolean(token && queryToken === token);
  const allowedByCookie = Boolean(token && cookieValue(req, "review_access") === token);
  const allowedByPin = Boolean(pin && hasValidPinSession(req));
  if (!allowedByQuery && !allowedByCookie && !allowedByPin) return { allowed: false, headers: {} };
  return {
    allowed: true,
    headers: allowedByQuery ? { "Set-Cookie": accessCookieHeader(token) } : {},
  };
}

function sendAccessDenied(req, res) {
  if (String(req.url || "").startsWith("/api/")) {
    sendJson(res, 401, { ok: false, error: "Kirish uchun PIN/parol kerak" });
    return;
  }
  res.writeHead(401, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(`<!doctype html>
<meta charset="utf-8">
<title>Kirish yopiq</title>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#eef6f6;font-family:Arial,sans-serif;color:#0f172a">
  <form method="post" action="/api/access/login" style="width:min(360px,calc(100vw - 32px));background:#fff;border:1px solid #cfe0e6;border-radius:14px;box-shadow:0 24px 80px rgba(15,23,42,.14);padding:22px">
    <h2 style="margin:0 0 6px;font-size:22px">Kirish himoyalangan</h2>
    <p style="margin:0 0 18px;color:#64748b;font-size:13px;line-height:1.45">Davom etish uchun umumiy PIN/parolni kiriting.</p>
    <input name="pin" type="password" autofocus autocomplete="current-password" placeholder="PIN yoki parol" style="width:100%;box-sizing:border-box;border:1px solid #cfe0e6;border-radius:10px;padding:12px 14px;font-size:15px;outline-color:#14b8a6">
    <button style="margin-top:12px;width:100%;border:0;border-radius:10px;background:#159e96;color:#fff;font-weight:800;padding:12px 14px;cursor:pointer">Kirish</button>
  </form>
</body>`);
}

function photoCacheMax() {
  return Math.max(50, Number(process.env.PHOTO_CACHE_MAX || DEFAULT_PHOTO_CACHE_MAX) || DEFAULT_PHOTO_CACHE_MAX);
}

function photoFetchTimeoutMs() {
  return Math.max(1000, Number(process.env.PHOTO_FETCH_TIMEOUT_MS || 10000) || 10000);
}

function allowedPhotoHosts() {
  return String(process.env.PHOTO_ALLOWED_DOMAINS || "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

function hostnameAllowedByConfig(hostname) {
  const allowed = allowedPhotoHosts();
  if (!allowed.length) return true;
  const host = String(hostname || "").toLowerCase();
  return allowed.some((allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`));
}

function isBlockedIpAddress(address) {
  const ip = String(address || "").toLowerCase();
  if (!ip) return true;
  if (ip === "localhost") return true;
  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") return true;
  if (/^fe80:/i.test(ip) || /^fc/i.test(ip) || /^fd/i.test(ip)) return true;
  if (!isIP(ip)) return false;
  if (ip.startsWith("127.") || ip.startsWith("10.") || ip.startsWith("169.254.")) return true;
  if (ip.startsWith("192.168.")) return true;
  const parts = ip.split(".").map(Number);
  if (parts.length === 4) {
    if (parts[0] === 0) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  }
  return false;
}

async function validatePhotoUrlForProxy(urlText) {
  let parsed;
  try {
    parsed = new URL(urlText);
  } catch {
    throw apiError("Foto URL noto'g'ri", 400);
  }
  if (!["http:", "https:"].includes(parsed.protocol)) throw apiError("Foto URL protokoli ruxsat etilmagan", 400);
  if (!hostnameAllowedByConfig(parsed.hostname)) throw apiError("Foto domeni ruxsat etilmagan", 403);
  if (isBlockedIpAddress(parsed.hostname)) throw apiError("Ichki tarmoq URL ruxsat etilmagan", 403);
  let records = [];
  try {
    records = await lookup(parsed.hostname, { all: true, verbatim: true });
  } catch {
    throw apiError("Foto domenini tekshirib bo'lmadi", 502);
  }
  if (!records.length || records.some((record) => isBlockedIpAddress(record.address))) {
    throw apiError("Ichki tarmoq manziliga ruxsat yo'q", 403);
  }
  return parsed.toString();
}

function photoDiskCacheEnabled() {
  return process.env.PHOTO_DISK_CACHE !== "0";
}

function photoDiskCacheRetentionDays() {
  return Math.max(1, Number(process.env.PHOTO_DISK_CACHE_RETENTION_DAYS || 1) || 1);
}

function cacheControlForFile(filePath) {
  const ext = extname(filePath).toLowerCase();
  if ([".js", ".css", ".png", ".jpg", ".jpeg", ".webp"].includes(ext)) return "public, max-age=604800, immutable";
  if (ext === ".html") return "public, max-age=30, must-revalidate";
  if (ext === ".json") return "public, max-age=10, must-revalidate";
  return "no-store";
}

function isCompressibleFile(filePath) {
  return [".html", ".js", ".css", ".json", ".csv"].includes(extname(filePath).toLowerCase());
}

function weakEtag(info) {
  return `W/"${Math.round(info.mtimeMs)}-${info.size}"`;
}

async function fileRevision(filePath) {
  try {
    const info = await stat(filePath);
    return `${Math.round(info.mtimeMs)}-${info.size}`;
  } catch (error) {
    if (error?.code === "ENOENT") return "0";
    throw error;
  }
}

async function reviewStateRevisions() {
  const [marks, reasons, brands] = await Promise.all([
    fileRevision(MARKS_FILE),
    fileRevision(REASONS_FILE),
    fileRevision(BRANDS_FILE),
  ]);
  return { marks, reasons, brands };
}

function gzipStaticFile(filePath, data, info) {
  const key = `${filePath}:${info.mtimeMs}:${info.size}`;
  const cached = staticGzipCache.get(key);
  if (cached) return cached;
  const gzipped = gzipSync(data, { level: 6 });
  staticGzipCache.set(key, gzipped);
  if (staticGzipCache.size > 80) staticGzipCache.delete(staticGzipCache.keys().next().value);
  return gzipped;
}

async function readStaticFileCached(filePath) {
  const ext = extname(filePath).toLowerCase();
  const cacheable = [".html", ".js", ".css", ".json"].includes(ext);
  if (!cacheable) return readFile(filePath);
  const info = await stat(filePath);
  const key = filePath;
  const cached = staticFileCache.get(key);
  if (cached && cached.mtimeMs === info.mtimeMs && cached.size === info.size) {
    return cached.data;
  }
  const data = await readFile(filePath);
  staticFileCache.set(key, { data, mtimeMs: info.mtimeMs, size: info.size });
  if (staticFileCache.size > 80) staticFileCache.delete(staticFileCache.keys().next().value);
  return data;
}

function photoCacheKey(url) {
  return createHash("sha256").update(String(url || "")).digest("hex");
}

function photoDiskPaths(url) {
  const key = photoCacheKey(url);
  return {
    dataPath: join(PHOTO_DISK_CACHE_DIR, `${key}.bin`),
    metaPath: join(PHOTO_DISK_CACHE_DIR, `${key}.json`),
  };
}

async function readPhotoFromDisk(url) {
  if (!photoDiskCacheEnabled()) return null;
  try {
    const { dataPath, metaPath } = photoDiskPaths(url);
    const [data, metaRaw] = await Promise.all([
      readFile(dataPath),
      readFile(metaPath, "utf8"),
    ]);
    const meta = JSON.parse(metaRaw);
    if (!/^image\//i.test(meta.contentType || "")) return null;
    return { contentType: meta.contentType, data };
  } catch {
    return null;
  }
}

async function writePhotoToDisk(url, photo) {
  if (!photoDiskCacheEnabled()) return;
  await mkdir(PHOTO_DISK_CACHE_DIR, { recursive: true });
  const { dataPath, metaPath } = photoDiskPaths(url);
  await Promise.all([
    writeFile(dataPath, photo.data),
    writeFile(metaPath, JSON.stringify({ contentType: photo.contentType, cachedAt: new Date().toISOString() }), "utf8"),
  ]);
}

async function cleanupPhotoDiskCache() {
  if (!photoDiskCacheEnabled()) return { deleted: 0, bytes: 0 };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today.getTime() - (photoDiskCacheRetentionDays() - 1) * 24 * 60 * 60 * 1000);
  let deleted = 0;
  let bytes = 0;
  let entries = [];
  try {
    entries = await readdir(PHOTO_DISK_CACHE_DIR, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return { deleted, bytes };
    throw error;
  }
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const filePath = join(PHOTO_DISK_CACHE_DIR, entry.name);
    try {
      const info = await stat(filePath);
      if (info.mtime >= cutoff) continue;
      await unlink(filePath);
      deleted += 1;
      bytes += info.size;
    } catch (error) {
      if (error?.code !== "ENOENT") console.warn("Photo cache cleanup xatosi:", error?.message || error);
    }
  }
  if (deleted) {
    console.log(`Photo cache cleanup: ${deleted} fayl, ${(bytes / 1048576).toFixed(2)} MB o'chirildi.`);
  }
  return { deleted, bytes };
}

function startPhotoCacheCleanup() {
  cleanupPhotoDiskCache().catch((error) => console.warn("Photo cache cleanup xatosi:", error?.message || error));
  setInterval(() => {
    cleanupPhotoDiskCache().catch((error) => console.warn("Photo cache cleanup xatosi:", error?.message || error));
  }, 6 * 60 * 60 * 1000).unref?.();
}

function runScheduledMaintenance() {
  const child = spawn(process.execPath, [MAINTENANCE_SCRIPT, "--apply"], {
    cwd: ROOT,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => console.log(String(chunk).trimEnd()));
  child.stderr.on("data", (chunk) => console.warn(String(chunk).trimEnd()));
  child.on("error", (error) => console.warn("Maintenance ishga tushmadi:", error?.message || error));
}

function startMaintenanceSchedule() {
  if (String(process.env.MAINTENANCE_AUTO_APPLY || "1") === "0") return;
  const intervalHours = Math.max(1, Number(process.env.MAINTENANCE_INTERVAL_HOURS || 24) || 24);
  const firstDelayMinutes = Math.max(1, Number(process.env.MAINTENANCE_INITIAL_DELAY_MINUTES || 15) || 15);
  setTimeout(() => {
    runScheduledMaintenance();
    setInterval(runScheduledMaintenance, intervalHours * 60 * 60 * 1000).unref?.();
  }, firstDelayMinutes * 60 * 1000).unref?.();
}

async function readPinFromRequest(req) {
  const type = String(req.headers["content-type"] || "");
  if (/application\/json/i.test(type)) {
    const body = await readTextBody(req);
    try {
      const data = JSON.parse(body || "{}");
      return String(data.pin || data.password || "").trim();
    } catch {
      return "";
    }
  }
  const body = await readTextBody(req);
  const params = new URLSearchParams(body);
  return String(params.get("pin") || params.get("password") || "").trim();
}

function safeCompareSecret(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

async function resolveCollectBrand(value) {
  const config = await loadBrandsConfig({ includeDisabled: false });
  const brand = findBrand(config, value);
  return brand ? publicBrand(brand) : null;
}

function publicCollectState() {
  return {
    running: collectState.running,
    startedAt: collectState.startedAt,
    finishedAt: collectState.finishedAt,
    date: collectState.date,
    brand: collectState.brand,
    status: collectState.status,
    awaiting: collectState.awaiting,
    pid: collectState.pid,
    exitCode: collectState.exitCode,
    outputFile: collectState.outputFile,
    logs: collectState.logs.slice(-180),
  };
}

function addCollectLog(chunk) {
  const text = String(chunk || "").replace(/\r/g, "");
  if (!text) return;
  for (const line of text.split("\n")) {
    const clean = line.trimEnd();
    if (!clean) continue;
    collectState.logs.push(clean);
    if (collectState.logs.length > 240) collectState.logs.splice(0, collectState.logs.length - 240);
    if (clean.includes("Dashboard va sana tayyor")) {
      collectState.status = "waiting_dashboard";
      collectState.awaiting = "dashboard";
    }
    if (clean.includes("Login kerak")) {
      collectState.status = "waiting_login";
      collectState.awaiting = null;
    }
    if (clean.includes("Sales dashboard tayyor")) {
      collectState.status = "preparing";
      collectState.awaiting = null;
    }
    if (clean.includes("Avtomatik tayyorlash")) {
      collectState.status = "preparing";
      collectState.awaiting = null;
    }
    if (clean.includes("Yig'ish boshlandi")) {
      collectState.status = "collecting";
      collectState.awaiting = null;
    }
    if (clean.startsWith("TAYYOR:")) {
      collectState.status = "waiting_close";
      collectState.awaiting = "close";
      collectState.outputFile = clean.replace(/^TAYYOR:\s*/, "").trim();
    }
    if (clean.includes("Brauzerni yopish uchun ENTER")) {
      collectState.status = "waiting_close";
      collectState.awaiting = "close";
    }
  }
}

function collectBrowserChannelFromHint(browserHint) {
  if (process.env.COLLECT_BROWSER_CHANNEL || process.env.BROWSER_CHANNEL) return "";
  const hint = String(browserHint || "");
  if (/Edg\//i.test(hint)) return "msedge";
  if (/Chrome\//i.test(hint) && !/Edg\/|OPR\/|YaBrowser\//i.test(hint)) return "chrome";
  return "";
}

async function startCollectJob({ date, brand, browserHint }) {
  if (collectState.running) throw apiError("Ma'lumot yig'ish allaqachon ishlayapti", 409);
  if (!isValidIsoDate(date)) throw apiError("Sana noto'g'ri. Format: YYYY-MM-DD", 400);
  const resolvedBrand = await resolveCollectBrand(brand);
  if (!resolvedBrand) throw apiError("Brend noto'g'ri. Brand Settings yoki config/brands.json ni tekshiring", 400);
  if (!resolvedBrand.agentPrefixes.length) throw apiError("Bu brend uchun agent prefix kiritilmagan. Agentlarni filterlash imkonsiz.", 400);
  const hintedBrowserChannel = collectBrowserChannelFromHint(browserHint);

  Object.assign(collectState, {
    running: true,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    date,
    brand: resolvedBrand.name,
    status: "starting",
    awaiting: null,
    pid: null,
    exitCode: null,
    outputFile: "",
    logs: [],
  });

  collectProcess = spawn(process.execPath, [COLLECT_SCRIPT, date, resolvedBrand.id], {
    cwd: ROOT,
    env: {
      ...process.env,
      AUTO_PREPARE: "1",
      APPLY_DATE: "0",
      STRICT_API: "1",
      LOAD_IMAGES: "0",
      KEEP_BROWSER_AFTER_COLLECT: "0",
      ...(hintedBrowserChannel ? { COLLECT_BROWSER_CHANNEL: hintedBrowserChannel } : {}),
      COLLECT_CONCURRENCY: process.env.COLLECT_CONCURRENCY || "12",
      COLLECT_FLUSH_EVERY: process.env.COLLECT_FLUSH_EVERY || "25",
    },
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: false,
  });
  collectState.pid = collectProcess.pid;
  addCollectLog(`Web orqali ishga tushdi: ${date} | ${resolvedBrand.name} | rejim: ${COLLECT_MODE === "browser" ? "brauzer (Chrome)" : "HTTP (brauzersiz)"}${hintedBrowserChannel && COLLECT_MODE === "browser" ? ` | browser: ${hintedBrowserChannel}` : ""}`);

  collectProcess.stdout.on("data", (data) => addCollectLog(data));
  collectProcess.stderr.on("data", (data) => addCollectLog(data));
  collectProcess.on("error", (error) => {
    collectState.status = "error";
    collectState.awaiting = null;
    addCollectLog(`XATO: ${error.message}`);
  });
  collectProcess.on("close", (code) => {
    collectState.running = false;
    collectState.finishedAt = new Date().toISOString();
    collectState.exitCode = code;
    collectState.awaiting = null;
    if (collectStopReason === "login_helper") {
      collectState.status = "waiting_login";
      addCollectLog("Collect to'xtatildi. Login oynasi alohida ochildi; login tugagach yig'ishni qayta boshlang.");
      collectStopReason = "";
      launchSalesLoginProcess();
    } else {
      if (collectState.status !== "error") collectState.status = code === 0 ? "done" : "failed";
      addCollectLog(code === 0 ? "Jarayon muvaffaqiyatli tugadi." : `Jarayon ${code} kodi bilan tugadi.`);
    }
    collectProcess = null;
  });
}

function launchSalesLoginProcess() {
  const child = process.platform === "win32" && existsSync(LOGIN_BAT)
    ? spawn("cmd", ["/c", "start", "", LOGIN_BAT], {
      cwd: ROOT,
      detached: true,
      stdio: "ignore",
      windowsHide: false,
    })
    : spawn(process.execPath, [LOGIN_SCRIPT], {
      cwd: ROOT,
      detached: true,
      stdio: "ignore",
      windowsHide: false,
    });
  child.on("error", (error) => addCollectLog(`Login oynasini ochishda xato: ${error.message}`));
  addCollectLog(`Login oynasi ishga tushirildi${child.pid ? `: PID ${child.pid}` : ""}.`);
  child.unref();
}

function openSalesLoginHelper() {
  if (collectProcess && collectState.running) {
    collectStopReason = "login_helper";
    collectState.status = "stopping";
    collectState.awaiting = null;
    addCollectLog("Login oynasini alohida ochish uchun collect to'xtatilmoqda...");
    const pid = collectProcess.pid;
    if (process.platform === "win32" && pid) {
      const killer = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
        cwd: ROOT,
        stdio: "ignore",
        windowsHide: true,
      });
      killer.on("error", () => collectProcess?.kill());
    } else {
      collectProcess.kill();
    }
    return;
  }
  collectState.status = "waiting_login";
  collectState.awaiting = null;
  addCollectLog("Server kompyuterida ko'rinadigan Sales login oynasi ochilmoqda...");
  launchSalesLoginProcess();
}

function collectContinue() {
  if (!collectProcess || !collectState.running) throw apiError("Ishlayotgan collect jarayoni yo'q", 409);
  collectProcess.stdin.write("\n");
  collectState.awaiting = null;
  if (collectState.status === "waiting_dashboard") collectState.status = "collecting";
  addCollectLog("Webdan ENTER yuborildi.");
}

function stopCollectJob() {
  if (!collectProcess || !collectState.running) throw apiError("To'xtatiladigan collect jarayoni yo'q", 409);
  collectState.status = "stopping";
  collectState.awaiting = null;
  addCollectLog("Webdan to'xtatish so'rovi yuborildi.");
  collectProcess.kill();
}

async function readReviewMarks() {
  try {
    const data = JSON.parse(await readFile(MARKS_FILE, "utf8"));
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch (error) {
    if (error?.code === "ENOENT") return {};
    throw error;
  }
}

async function readSuspiciousPhotos() {
  try {
    const data = JSON.parse(await readFile(SUSPICIOUS_PHOTOS_FILE, "utf8"));
    const items = Array.isArray(data?.items) ? data.items : [];
    return {
      items: items.filter((item) => item && typeof item === "object" && item.url),
      updatedAt: data?.updatedAt || "",
    };
  } catch (error) {
    if (error?.code === "ENOENT") return { items: [], updatedAt: "" };
    throw error;
  }
}

function suspiciousPhotoFromMark(key, mark) {
  if (!mark || typeof mark !== "object" || String(mark.verdict || "").toUpperCase() !== "MINUS" || !mark.url) return null;
  return {
    key,
    date: mark.date || "",
    brandId: mark.brandId || "",
    brandName: mark.brandName || "",
    code: mark.code || "",
    agent: mark.agent || "",
    photo: mark.photo || "",
    client: mark.client || "",
    clientId: mark.clientId || "",
    photoTime: mark.photoTime || "",
    url: mark.url || "",
    verdict: "MINUS",
    reasons: Array.isArray(mark.reasons) ? mark.reasons.filter(Boolean) : [],
    note: mark.note || "",
    source: mark.source || "manual",
    ruleScore: mark.ruleScore || 0,
    savedAt: mark.savedAt || "",
    updatedAt: mark.updatedAt || mark.savedAt || "",
  };
}

function suspiciousSortTime(item) {
  const time = Date.parse(item?.updatedAt || item?.savedAt || item?.date || "");
  return Number.isFinite(time) ? time : 0;
}

async function rebuildSuspiciousPhotosFromMarks(marks) {
  const byKey = new Map();
  for (const [key, mark] of Object.entries(marks || {})) {
    const item = suspiciousPhotoFromMark(key, mark);
    if (item) byKey.set(key, item);
  }
  const items = [...byKey.values()].sort((a, b) => suspiciousSortTime(a) - suspiciousSortTime(b));
  const payload = { updatedAt: new Date().toISOString(), total: items.length, items };
  await safeWriteJson(SUSPICIOUS_PHOTOS_FILE, payload, "suspicious photos");
  return payload;
}

function normalizeMetricEntry(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
  const metrics = entry.metrics && typeof entry.metrics === "object" && !Array.isArray(entry.metrics)
    ? entry.metrics
    : entry;
  if (!metrics || typeof metrics.hash !== "string" || !metrics.hash) return null;
  return {
    metrics,
    ts: Number(entry.ts || Date.now()) || Date.now(),
  };
}

async function readPhotoMetricsCache() {
  try {
    const data = JSON.parse(await readFile(PHOTO_METRICS_FILE, "utf8"));
    const rawItems = data?.items && typeof data.items === "object" && !Array.isArray(data.items) ? data.items : {};
    const items = {};
    for (const [url, entry] of Object.entries(rawItems)) {
      const normalized = normalizeMetricEntry(entry);
      if (url && normalized) items[url] = normalized;
    }
    return { items, updatedAt: data?.updatedAt || "", total: Object.keys(items).length };
  } catch (error) {
    if (error?.code === "ENOENT") return { items: {}, updatedAt: "", total: 0 };
    throw error;
  }
}

async function writePhotoMetricsCache(incoming) {
  const current = await readPhotoMetricsCache();
  const items = { ...current.items };
  const source = incoming?.items && typeof incoming.items === "object" && !Array.isArray(incoming.items)
    ? incoming.items
    : incoming;
  for (const [url, entry] of Object.entries(source || {})) {
    const normalized = normalizeMetricEntry(entry);
    if (url && normalized) items[url] = normalized;
  }
  const sorted = Object.entries(items)
    .sort((a, b) => (b[1]?.ts || 0) - (a[1]?.ts || 0))
    .slice(0, Math.max(200, PHOTO_METRICS_LIMIT));
  const compactItems = Object.fromEntries(sorted);
  const payload = {
    updatedAt: new Date().toISOString(),
    total: sorted.length,
    items: compactItems,
  };
  await safeWriteJson(PHOTO_METRICS_FILE, payload, "photo metrics cache");
  return payload;
}

function markTime(value) {
  const time = Date.parse(value?.updatedAt || value?.savedAt || value?.approvedAt || value?.telegramSentAt || "");
  return Number.isFinite(time) ? time : 0;
}

function mergeReviewMarks(base, incoming) {
  const merged = { ...(base || {}) };
  for (const [key, value] of Object.entries(incoming || {})) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const previous = merged[key];
    if (value._deleted === true) {
      if (!previous || markTime(value) >= markTime(previous)) {
        merged[key] = {
          _deleted: true,
          date: value.date || previous?.date || "",
          code: value.code || previous?.code || "",
          url: value.url || previous?.url || "",
          updatedAt: value.updatedAt || new Date().toISOString(),
          updatedBy: value.updatedBy || "",
        };
      }
      continue;
    }
    const next = { ...(previous || {}), ...value };
    if (previous?.telegramSentAt || value?.telegramSentAt) {
      next.telegramSentAt = previous?.telegramSentAt || value?.telegramSentAt;
    }
    if (!next.updatedAt) next.updatedAt = next.savedAt || new Date().toISOString();
    merged[key] = previous && markTime(previous) > markTime(next)
      ? { ...next, ...previous, telegramSentAt: next.telegramSentAt || previous.telegramSentAt }
      : next;
  }
  return merged;
}

function markMatchesBrandFilter(mark, brandId, brandsConfig) {
  const brand = findBrand(brandsConfig, brandId, { includeDisabled: true });
  if (!brand) return true;
  const code = String(mark?.code || "").toUpperCase();
  const prefixes = Array.isArray(brand.agentPrefixes) ? brand.agentPrefixes : [];
  return prefixes.some((prefix) => code.startsWith(String(prefix || "").toUpperCase()));
}

function filterReviewMarks(marks, { brand = "", date = "", verdict = "" } = {}, brandsConfig = { brands: [] }) {
  const cleanBrand = String(brand || "").trim();
  const cleanDate = String(date || "").trim();
  const cleanVerdict = String(verdict || "").trim().toUpperCase();
  if (!cleanBrand && !cleanDate && !cleanVerdict) return marks || {};
  const out = {};
  for (const [key, mark] of Object.entries(marks || {})) {
    if (cleanDate && String(mark?.date || "") !== cleanDate) continue;
    if (cleanVerdict && String(mark?.verdict || "").toUpperCase() !== cleanVerdict) continue;
    if (cleanBrand && !markMatchesBrandFilter(mark, cleanBrand, brandsConfig)) continue;
    out[key] = mark;
  }
  return out;
}

async function writeReviewMarks(marks) {
  if (!marks || typeof marks !== "object" || Array.isArray(marks)) {
    throw new Error("Marks qiymati noto'g'ri");
  }
  const writeJob = async () => {
    const merged = mergeReviewMarks(await readReviewMarks(), marks);
    await safeWriteJson(MARKS_FILE, merged, "review marks");
    await rebuildSuspiciousPhotosFromMarks(merged);
    return merged;
  };
  const job = marksWriteQueue.then(writeJob, writeJob);
  marksWriteQueue = job.catch(() => {});
  return job;
}

async function deleteReviewMarks({ date = "" } = {}) {
  const cleanDate = String(date || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) throw apiError("Marks sanasi noto'g'ri", 400);
  const writeJob = async () => {
    const current = await readReviewMarks();
    const now = new Date().toISOString();
    const filtered = { ...current };
    let deleted = 0;
    for (const [key, mark] of Object.entries(current)) {
      if (String(mark?.date || "") !== cleanDate || mark?._deleted) continue;
      filtered[key] = { _deleted: true, date: cleanDate, code: mark?.code || "", url: mark?.url || "", updatedAt: now, updatedBy: "dataset-delete" };
      deleted += 1;
    }
    await safeWriteJson(MARKS_FILE, filtered, "review marks");
    await rebuildSuspiciousPhotosFromMarks(filtered);
    return { marks: filtered, deleted };
  };
  const job = marksWriteQueue.then(writeJob, writeJob);
  marksWriteQueue = job.catch(() => {});
  return job;
}

async function readReviewReasons() {
  try {
    const data = JSON.parse(await readFile(REASONS_FILE, "utf8"));
    return {
      customReasons: Array.isArray(data.customReasons) ? data.customReasons.filter(Boolean) : [],
      reasonOverrides: data.reasonOverrides && typeof data.reasonOverrides === "object" && !Array.isArray(data.reasonOverrides) ? data.reasonOverrides : {},
      deletedReasons: Array.isArray(data.deletedReasons) ? data.deletedReasons.filter(Boolean) : [],
      updatedAt: data.updatedAt || "",
    };
  } catch (error) {
    if (error?.code === "ENOENT") return { customReasons: [], reasonOverrides: {}, deletedReasons: [], updatedAt: "" };
    throw error;
  }
}

function reasonKey(reason) {
  return String(reason || "").trim().toLowerCase();
}

async function writeReviewReasons(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Reasons qiymati noto'g'ri");
  }
  const writeJob = async () => {
    const current = await readReviewReasons();
    const deletedReasons = [
      ...new Set([
        ...current.deletedReasons,
        ...(Array.isArray(input.deletedReasons) ? input.deletedReasons : []),
      ].map((item) => String(item || "").trim()).filter(Boolean)),
    ];
    const deletedSet = new Set(deletedReasons.map(reasonKey));
    const customReasons = [
      ...new Set([
        ...current.customReasons,
        ...(Array.isArray(input.customReasons) ? input.customReasons : []),
      ].map((item) => String(item || "").trim()).filter(Boolean)),
    ].filter((item) => !deletedSet.has(reasonKey(item)));
    const reasonOverrides = {
      ...current.reasonOverrides,
      ...(input.reasonOverrides && typeof input.reasonOverrides === "object" && !Array.isArray(input.reasonOverrides) ? input.reasonOverrides : {}),
    };
    Object.keys(reasonOverrides).forEach((key) => {
      if (deletedSet.has(reasonKey(key)) || deletedSet.has(reasonKey(reasonOverrides[key]))) delete reasonOverrides[key];
    });
    const saved = { customReasons, reasonOverrides, deletedReasons, updatedAt: new Date().toISOString() };
    await safeWriteJson(REASONS_FILE, saved, "review reasons");
    return saved;
  };
  const job = reasonsWriteQueue.then(writeJob, writeJob);
  reasonsWriteQueue = job.catch(() => {});
  return job;
}

async function proxyPhoto(url) {
  const text = await validatePhotoUrlForProxy(String(url || "").trim());
  const cached = photoCache.get(text);
  if (cached) {
    photoCache.delete(text);
    photoCache.set(text, cached);
    return { ...cached, cached: true };
  }
  const diskCached = await readPhotoFromDisk(text);
  if (diskCached) {
    photoCache.set(text, diskCached);
    while (photoCache.size > photoCacheMax()) photoCache.delete(photoCache.keys().next().value);
    return { ...diskCached, cached: true };
  }
  if (photoInflight.has(text)) {
    const photo = await photoInflight.get(text);
    return { ...photo, cached: true };
  }
  const fetchPromise = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), photoFetchTimeoutMs());
    try {
      const response = await fetch(text, {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "User-Agent": "Mozilla/5.0 LMJ-Photo-Review",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
      });
      if (response.status >= 300 && response.status < 400) throw apiError("Foto URL redirect qaytardi. Xavfsizlik uchun bloklandi", 400);
      if (!response.ok) throw apiError(`Foto yuklanmadi: HTTP ${response.status}`, 502);
      const contentType = response.headers.get("content-type") || "image/jpeg";
      if (!/^image\//i.test(contentType)) throw apiError("URL rasm qaytarmadi", 415);
      const photo = {
        contentType,
        data: Buffer.from(await response.arrayBuffer()),
      };
      photoCache.set(text, photo);
      while (photoCache.size > photoCacheMax()) photoCache.delete(photoCache.keys().next().value);
      await writePhotoToDisk(text, photo).catch(() => {});
      return photo;
    } catch (error) {
      if (error?.name === "AbortError") throw apiError("Foto yuklash vaqti tugadi", 504);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  })();
  photoInflight.set(text, fetchPromise);
  try {
    const photo = await fetchPromise;
    return { ...photo, cached: false };
  } finally {
    photoInflight.delete(text);
  }
}

function photoThumbnailWidth() {
  return Math.max(320, Math.min(1200, Number(process.env.PHOTO_THUMB_WIDTH || 720) || 720));
}

function photoThumbnailHeight() {
  return Math.max(480, Math.min(1600, Number(process.env.PHOTO_THUMB_HEIGHT || 960) || 960));
}

function photoThumbnailQuality() {
  return Math.max(45, Math.min(90, Number(process.env.PHOTO_THUMB_QUALITY || 74) || 74));
}

async function proxyPhotoThumbnail(url) {
  const text = await validatePhotoUrlForProxy(String(url || "").trim());
  const width = photoThumbnailWidth();
  const height = photoThumbnailHeight();
  const quality = photoThumbnailQuality();
  const variantKey = `${text}\nthumb:${width}x${height}:q${quality}`;
  const cached = photoCache.get(variantKey);
  if (cached) {
    photoCache.delete(variantKey);
    photoCache.set(variantKey, cached);
    return { ...cached, cached: true };
  }
  const diskCached = await readPhotoFromDisk(variantKey);
  if (diskCached) {
    photoCache.set(variantKey, diskCached);
    while (photoCache.size > photoCacheMax()) photoCache.delete(photoCache.keys().next().value);
    return { ...diskCached, cached: true };
  }
  if (photoThumbnailInflight.has(variantKey)) {
    const photo = await photoThumbnailInflight.get(variantKey);
    return { ...photo, cached: true };
  }
  const job = (async () => {
    const original = await proxyPhoto(text);
    const data = await sharp(original.data, { limitInputPixels: 60_000_000 })
      .rotate()
      .resize({ width, height, fit: "inside", withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toBuffer();
    const photo = { contentType: "image/webp", data };
    photoCache.set(variantKey, photo);
    while (photoCache.size > photoCacheMax()) photoCache.delete(photoCache.keys().next().value);
    await writePhotoToDisk(variantKey, photo).catch(() => {});
    return photo;
  })();
  photoThumbnailInflight.set(variantKey, job);
  try {
    const photo = await job;
    return { ...photo, cached: false };
  } finally {
    photoThumbnailInflight.delete(variantKey);
  }
}

async function deleteDatasetByDate(date) {
  if (!date || String(date).length > 60 || /[/\\]/.test(String(date))) {
    throw new Error("Sana qiymati noto'g'ri");
  }

  const manifestPath = join(DATA_OUTPUTS, "lmj_review_datasets.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const before = Array.isArray(manifest.datasets) ? manifest.datasets : [];
  const item = before.find((dataset) => dataset.date === date);
  if (!item) throw new Error(`Bu sana topilmadi: ${date}`);

  const filePath = safePath(`/${item.file}`);
  if (!filePath || extname(filePath).toLowerCase() !== ".json") {
    throw new Error("Dataset fayl yo'li xavfsiz emas");
  }

  try {
    await unlink(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  manifest.datasets = before.filter((dataset) => dataset.date !== date);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  return { date, deletedFile: item.file, datasets: manifest.datasets };
}

function lookupKey(value) {
  return cleanText(value).toLowerCase();
}

function compactLookupKey(value) {
  return lookupKey(value).replace(/[^a-z0-9]+/gi, "");
}

function buildClientOrderMap(items) {
  const map = new Map();
  for (const item of items || []) {
    const sum = Number(item.clientOrderSum ?? item.orderSum ?? item.sum ?? item.totalOrderAmount?.amount ?? item.total_order_amount?.amount ?? 0) || 0;
    for (const key of [item.apiId, item.id, item.clientId, item.visualId, item.visual_id, item.code, item.name, item.client]) {
      const normal = lookupKey(key);
      const compacted = compactLookupKey(key);
      if (normal && !map.has(normal)) map.set(normal, sum);
      if (compacted && !map.has(compacted)) map.set(compacted, sum);
    }
  }
  return map;
}

function clientOrderFrom(map, item, row) {
  const direct = Number(item.clientOrderSum ?? item.orderSum ?? row.clientOrderSum ?? row.orderSum ?? 0) || 0;
  if (direct) return direct;
  for (const key of [item.clientId, row.clientId, item.visualId, row.visualId, item.visual_id, row.visual_id, item.client, row.client]) {
    const normal = lookupKey(key);
    const compacted = compactLookupKey(key);
    if (normal && map.has(normal)) return Number(map.get(normal)) || 0;
    if (compacted && map.has(compacted)) return Number(map.get(compacted)) || 0;
  }
  return 0;
}

function normalizeDataset(raw) {
  const source = raw?.agents || raw?.rows || [];
  return source.map((agent, agentIndex) => {
    const code = agent.code || `AGENT${agentIndex + 1}`;
    const photos = [];
    const clientOrders = buildClientOrderMap(agent.clients || agent.clientRows || []);
    if (Array.isArray(agent.photos)) {
      agent.photos.forEach((row, rowIndex) => {
        const items = Array.isArray(row.photoItems) || Array.isArray(row.items)
          ? (row.photoItems || row.items)
          : null;
        if (items) {
          items.forEach((item, itemIndex) => photos.push({
            id: `r${rowIndex + 1}_${itemIndex + 1}`,
            url: item.url || item.src || "",
            client: item.client || row.client || "",
            clientOrderSum: clientOrderFrom(clientOrders, item, row),
            clientOrderCount: Number(item.clientOrderCount ?? row.clientOrderCount ?? 0) || 0,
            clientHasOrder: item.clientHasOrder ?? row.clientHasOrder,
            clientOrderKnown: item.clientOrderKnown ?? row.clientOrderKnown,
            clientOrderSource: item.clientOrderSource || row.clientOrderSource || "",
            clientOrderStatuses: item.clientOrderStatuses || row.clientOrderStatuses || [],
            clientId: item.clientId || row.clientId || "",
            category: item.photoCategory || item.category || row.photoCategory || row.category || "",
            territory: item.territory || row.territory || "",
            photoTime: item.photoTime || item.upload_time || row.photoTime || "",
            row: row.row || rowIndex + 1,
          }));
          return;
        }
        (row.urls || []).forEach((url, itemIndex) => photos.push({
          id: `r${rowIndex + 1}_${itemIndex + 1}`,
          url,
          client: row.client || "",
          clientOrderSum: clientOrderFrom(clientOrders, row, row),
          clientOrderCount: Number(row.clientOrderCount ?? 0) || 0,
          clientHasOrder: row.clientHasOrder,
          clientOrderKnown: row.clientOrderKnown,
          clientOrderSource: row.clientOrderSource || "",
          clientOrderStatuses: row.clientOrderStatuses || [],
          clientId: row.clientId || "",
          category: row.photoCategory || row.category || "",
          territory: row.territory || "",
          photoTime: (row.photoTimes && row.photoTimes[itemIndex]) || row.photoTime || "",
          row: row.row || rowIndex + 1,
        }));
      });
    } else {
      (agent.urls || []).forEach((url, index) => photos.push({
        id: `p${index + 1}`,
        url,
        client: "",
        clientOrderSum: 0,
        clientId: "",
        category: "",
        territory: "",
        photoTime: "",
        row: index + 1,
      }));
    }
    const match = String(code).match(/^([A-Z]+)(\d+)/i);
    return {
      code,
      agent: agent.agent || agent.modalTitle || code,
      group: match ? match[1] : code,
      tail: match ? Number(match[2]) : 999,
      orderSum: Number(agent.orderSum ?? agent.sum ?? 0) || 0,
      collectStatus: agent.status || "ok",
      photos,
    };
  })
    .filter((agent) => agent.collectStatus !== "duplicate" && agent.collectStatus !== "error")
    .filter((agent) => agent.photos.length > 0)
    .sort((a, b) => a.group.localeCompare(b.group) || a.orderSum - b.orderSum || a.tail - b.tail || a.code.localeCompare(b.code));
}

function compact(value, max = 900) {
  const text = String(value || "").trim();
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function shortReason(reason) {
  return (LEGACY_REASONS[cleanText(reason)] || cleanText(reason))
    .replace("Ish vaqtidan tashqari olingan foto", "Ish vaqtidan tashqari")
    .replace("Kamera yopilgan yoki to'sib olingan foto", "Kamera yopilgan")
    .replace("Bitta do'kondan takroriy foto", "Takroriy foto")
    .replace("Ekrandan qayta olingan foto", "Ekran rasmi")
    .replace("Katalogdan olingan rasm", "Katalog rasmi")
    .replace("Faqat mahsulot rasmi", "Mahsulot rasmi")
    .replace("Foto talabga javob bermaydi", "Talabga javob bermaydi");
}

function formatPhotoTime(value) {
  const text = cleanText(value);
  if (!text) return "";
  const date = text.match(/\d{4}-\d{2}-\d{2}/)?.[0] || "";
  const time = text.match(/\b\d{2}:\d{2}\b/)?.[0] || "";
  return [date, time].filter(Boolean).join(" ");
}

function brandFromCode(code) {
  const value = cleanText(code).toUpperCase();
  if (value.startsWith("JY")) return { code: "JY", name: "SOF" };
  if (value.startsWith("MONNO")) return { code: "MONNO", name: "MONNO" };
  return { code: "LMJ", name: "LALAKU MAMA" };
}

function brandFromItem(item) {
  const name = cleanText(item?.brandName || item?.brand?.name);
  const code = cleanText(item?.brandCode || item?.brandId || item?.brand?.id).toUpperCase();
  if (name) return { code: code || name.toUpperCase(), name };
  return brandFromCode(item?.code || "");
}

function telegramCaption(item) {
  return compact([
    "🚩 LMJ shubhali foto",
    `Sana: ${item.date || ""}`,
    `Agent: ${item.code || ""}${item.agent ? ` | ${item.agent}` : ""}`,
    `Foto: ${item.photo || ""}`,
    item.client ? `Klient: ${item.client}` : "",
    item.clientId ? `Klient ID: ${item.clientId}` : "",
    item.photoTime ? `Vaqt: ${item.photoTime}` : "",
    item.reasons?.length ? `Sabab: ${item.reasons.join("; ")}` : "",
    item.note ? `Izoh: ${item.note}` : "",
  ].filter(Boolean).join("\n"), 1000);
}

function optimizedTelegramCaption(item) {
  const reasons = Array.isArray(item.reasons)
    ? item.reasons.map(shortReason).filter(Boolean)
    : [];
  const title = cleanText(process.env.TELEGRAM_CAPTION_TITLE).replace("рџљ©", "\u{1F6A9}") || "\u{1F6A9} (LMJ) LALAKU MAMA";

  return compact([
    title,
    item.date ? `Sana: ${cleanText(item.date)}` : "",
    item.code ? `Smart kod:${cleanText(item.code)}` : "",
    "",
    item.agent ? `Agent: ${cleanText(item.agent)}` : "",
    "",
    item.client ? `Klient: ${cleanText(item.client)}` : "",
    item.clientId ? `Klient ID: ${cleanText(item.clientId)}` : "",
    "",
    reasons.length ? `Sabab: ${reasons.join("; ")}` : "",
    item.note ? `Izoh: ${cleanText(item.note)}` : "",
  ].filter((line) => line === "" || Boolean(line)).join("\n"), 1000);
}

function telegramCaptionV2(item) {
  const reasons = Array.isArray(item.reasons)
    ? item.reasons.map(shortReason).filter(Boolean)
    : [];
  const date = cleanText(item.date);
  const code = cleanText(item.code);
  const brand = brandFromItem(item);
  const agentName = agentDisplayName(item.agent);

  return compact([
    `\u{1F6A9} ${brand.name}${date ? ` | ${date}` : ""}`,
    code ? `Kod: ${code}` : "",
    agentName ? `Agent: ${agentName}` : "",
    "",
    item.client ? `Klient: ${cleanText(item.client)}` : "",
    reasons.length ? `Sabab: ${reasons.join("; ")}` : "",
    item.note ? `Izoh: ${cleanText(item.note)}` : "",
  ].filter((line) => line === "" || Boolean(line)).join("\n"), 1000);
}

function itemKey(item) {
  return [
    cleanText(item.date),
    cleanText(item.code),
    cleanText(item.photo),
  ].join("#");
}

function groupKey(item) {
  return [
    cleanText(item.date),
    cleanText(item.code),
  ].join("#");
}

function agentDisplayName(value) {
  const text = cleanText(value);
  const bracket = text.match(/\[([^\]]+)\]/);
  if (bracket?.[1]) return compact(bracket[1], 70);
  return compact(text.replace(/^(LMJ|JY)\S*\s*/i, "").replace(/\b\d{2}[.-]\d{2}[.-]\d{2,4}\b/g, "").trim(), 70);
}

function groupedTelegramCaption(items) {
  const first = items[0] || {};
  const reasons = [...new Set(items.flatMap((item) => (
    Array.isArray(item.reasons) ? item.reasons.map(shortReason) : []
  )).filter(Boolean))];
  const clients = [...new Set(items.map((item) => cleanText(item.client)).filter(Boolean))];
  const notes = [...new Set(items.map((item) => cleanText(item.note)).filter(Boolean))];
  const agentName = agentDisplayName(first.agent);
  const date = cleanText(first.date);
  const code = cleanText(first.code);
  const brand = brandFromItem(first);

  return compact([
    `\u{1F6A9} ${brand.name}${date ? ` | ${date}` : ""}`,
    code ? `Kod: ${code}` : "",
    agentName ? `Agent: ${agentName}` : "",
    "",
    `Klient: ${clients.length || items.length} ta`,
    reasons.length ? `Sabab: ${reasons.join("; ")}` : "",
    notes.length ? `Izohlar: ${notes.slice(0, 5).join("; ")}${notes.length > 5 ? "; ..." : ""}` : "",
  ].filter((line) => line === "" || Boolean(line)).join("\n"), 1000);
}

function chunkText(text, max = 3600) {
  const chunks = [];
  let rest = String(text || "");
  while (rest.length > max) {
    const index = Math.max(rest.lastIndexOf("\n", max), rest.lastIndexOf("; ", max), max);
    chunks.push(rest.slice(0, index).trim());
    rest = rest.slice(index).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

function telegramHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function telegramErrorText(json, method) {
  return String(json?.description || json?.error || `Telegram ${method} xatosi`);
}

async function telegramRequest(method, payload, options = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN sozlanmagan");

  const maxAttempts = Number(options.maxAttempts || 3);
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));

    if (res.ok && json.ok !== false) return json.result;

    const errorText = telegramErrorText(json, method);
    const retryAfter = Number(json?.parameters?.retry_after || errorText.match(/retry after (\d+)/i)?.[1] || 0);
    if ((res.status === 429 || /Too Many Requests/i.test(errorText)) && retryAfter && attempt < maxAttempts) {
      await sleep((retryAfter + 1) * 1000);
      continue;
    }

    throw new Error(errorText);
  }

  throw new Error(`Telegram ${method} xatosi`);
}

async function telegramPause() {
  const ms = Math.max(0, Number(process.env.TELEGRAM_DELAY_MS || 80));
  if (ms) await sleep(ms);
}

function telegramDetailConcurrency() {
  return Math.max(1, Math.min(20, Number(process.env.TELEGRAM_DETAIL_CONCURRENCY || 8) || 8));
}

function telegramWarmCacheConcurrency() {
  return Math.max(1, Math.min(5, Number(process.env.TELEGRAM_WARM_CACHE_CONCURRENCY || 2) || 2));
}

function telegramFileCacheChatId() {
  return cleanText(process.env.TELEGRAM_FILE_CACHE_CHAT_ID || process.env.TELEGRAM_CACHE_CHAT_ID || "");
}

function telegramFileCacheDeleteMessages() {
  return process.env.TELEGRAM_FILE_CACHE_DELETE_MESSAGES !== "0";
}

function telegramPhotoFetchTimeoutMs() {
  return Math.max(1000, Number(process.env.TELEGRAM_PHOTO_FETCH_TIMEOUT_MS || 10000) || 10000);
}

async function fetchTelegramPhoto(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), telegramPhotoFetchTimeoutMs());
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Foto yuklash vaqti tugadi");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

let telegramFileCache = null;
let telegramFileCacheWriteChain = Promise.resolve();

function telegramFileCacheKey(item) {
  const stable = cleanText(item?.url) || [cleanText(item?.date), cleanText(item?.code), cleanText(item?.photo)].join("#");
  return createHash("sha256").update(stable).digest("hex");
}

function bestTelegramPhotoFileId(message) {
  const photos = Array.isArray(message?.photo) ? message.photo : [];
  if (!photos.length) return "";
  const best = [...photos].sort((a, b) => Number(b.file_size || 0) - Number(a.file_size || 0))[0];
  return cleanText(best?.file_id);
}

async function readTelegramFileCache() {
  if (telegramFileCache) return telegramFileCache;
  try {
    const data = JSON.parse(await readFile(TELEGRAM_FILE_CACHE_FILE, "utf8"));
    telegramFileCache = data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch (error) {
    if (error?.code !== "ENOENT") console.warn("Telegram file cache o'qish xatosi:", error?.message || error);
    telegramFileCache = {};
  }
  return telegramFileCache;
}

async function writeTelegramFileCache() {
  const snapshot = telegramFileCache || {};
  telegramFileCacheWriteChain = telegramFileCacheWriteChain.then(async () => {
    await writeFile(TELEGRAM_FILE_CACHE_FILE, JSON.stringify(snapshot, null, 2), "utf8");
  }).catch((error) => {
    console.warn("Telegram file cache yozish xatosi:", error?.message || error);
  });
  return telegramFileCacheWriteChain;
}

async function cachedTelegramFileId(item) {
  const cache = await readTelegramFileCache();
  const entry = cache[telegramFileCacheKey(item)];
  return cleanText(entry?.fileId);
}

async function rememberTelegramFileId(item, fileId, source = "telegram") {
  const id = cleanText(fileId);
  if (!id) return;
  const cache = await readTelegramFileCache();
  cache[telegramFileCacheKey(item)] = {
    fileId: id,
    url: cleanText(item?.url),
    code: cleanText(item?.code),
    photo: cleanText(item?.photo),
    updatedAt: new Date().toISOString(),
    source,
  };
  if (Object.keys(cache).length > 20000) {
    const sorted = Object.entries(cache).sort((a, b) => String(a[1]?.updatedAt || "").localeCompare(String(b[1]?.updatedAt || "")));
    for (const [key] of sorted.slice(0, Math.max(0, sorted.length - 18000))) delete cache[key];
  }
  await writeTelegramFileCache();
}

async function forgetTelegramFileId(item) {
  const cache = await readTelegramFileCache();
  const key = telegramFileCacheKey(item);
  if (!cache[key]) return;
  delete cache[key];
  await writeTelegramFileCache();
}

async function rememberTelegramMediaResults(items, results, source = "telegram") {
  if (!Array.isArray(results)) return;
  await Promise.all(items.map((item, index) => rememberTelegramFileId(item, bestTelegramPhotoFileId(results[index]), source)));
}

const telegramWarmCacheQueue = [];
const telegramWarmCacheQueued = new Set();
let telegramWarmCacheActive = 0;

async function warmTelegramFileCacheItem(item, cacheChatId) {
  if (!item?.url || !/^https?:\/\//i.test(item.url)) return { ok: false, error: "Foto URL noto'g'ri" };
  if (await cachedTelegramFileId(item)) return { ok: true, skipped: true };
  const uploaded = await sendPhotoByUpload(item, cacheChatId, null, "", { disableNotification: true });
  if (telegramFileCacheDeleteMessages() && uploaded?.message_id) {
    telegramRequest("deleteMessage", {
      chat_id: cacheChatId,
      message_id: uploaded.message_id,
    }, { maxAttempts: 1 }).catch(() => { });
  }
  return { ok: true, messageId: uploaded.message_id, uploaded: true };
}

function pumpTelegramWarmCacheQueue() {
  const cacheChatId = telegramFileCacheChatId();
  if (!cacheChatId) return;
  const limit = telegramWarmCacheConcurrency();
  while (telegramWarmCacheActive < limit && telegramWarmCacheQueue.length) {
    const item = telegramWarmCacheQueue.shift();
    const key = telegramFileCacheKey(item);
    telegramWarmCacheActive += 1;
    warmTelegramFileCacheItem(item, cacheChatId)
      .catch((error) => console.warn("Telegram file_id warm cache xatosi:", error?.message || error))
      .finally(() => {
        telegramWarmCacheQueued.delete(key);
        telegramWarmCacheActive -= 1;
        pumpTelegramWarmCacheQueue();
      });
  }
}

async function enqueueTelegramWarmCache(items, avoidChatId = "") {
  const cacheChatId = telegramFileCacheChatId();
  if (!cacheChatId || !Array.isArray(items) || !items.length) return { queued: 0, enabled: false };
  if (avoidChatId && String(cacheChatId) === String(avoidChatId)) {
    return { queued: 0, enabled: false, skippedSameChat: true };
  }
  let queued = 0;
  for (const item of items) {
    if (!item?.url || !/^https?:\/\//i.test(item.url)) continue;
    if (await cachedTelegramFileId(item)) continue;
    const key = telegramFileCacheKey(item);
    if (telegramWarmCacheQueued.has(key)) continue;
    telegramWarmCacheQueued.add(key);
    telegramWarmCacheQueue.push(item);
    queued += 1;
  }
  pumpTelegramWarmCacheQueue();
  return { queued, enabled: true };
}

async function readTelegramSessions() {
  try {
    const data = JSON.parse(await readFile(TELEGRAM_SESSIONS_FILE, "utf8"));
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch (error) {
    if (error?.code === "ENOENT") return {};
    throw error;
  }
}

async function writeTelegramSessions(sessions) {
  const now = Date.now();
  const ttlMs = Math.max(1, Number(process.env.TELEGRAM_REVIEW_SESSION_TTL_DAYS || 3650) || 3650) * 24 * 60 * 60 * 1000;
  const clean = {};
  for (const [token, session] of Object.entries(sessions || {})) {
    const created = Date.parse(session?.createdAt || "") || now;
    if (now - created <= ttlMs) clean[token] = session;
  }
  await writeFile(TELEGRAM_SESSIONS_FILE, JSON.stringify(clean, null, 2), "utf8");
  return clean;
}

function telegramAdminIds() {
  return new Set(String(process.env.TELEGRAM_ADMIN_IDS || "6649270385").split(",").map((id) => cleanText(id)).filter(Boolean));
}

function telegramUserFromMessage(message) {
  const user = message?.from || {};
  return {
    id: user.id ? String(user.id) : "",
    username: cleanText(user.username),
    firstName: cleanText(user.first_name),
    lastName: cleanText(user.last_name),
    languageCode: cleanText(user.language_code),
    isAdmin: telegramAdminIds().has(String(user.id || "")),
  };
}

function isTelegramAdminUser(user) {
  return Boolean(user?.isAdmin || telegramAdminIds().has(String(user?.id || "")));
}

let telegramUsageStatsWriteChain = Promise.resolve();

async function readTelegramUsageStats() {
  try {
    const data = JSON.parse(await readFile(TELEGRAM_USAGE_STATS_FILE, "utf8"));
    return data && typeof data === "object" && !Array.isArray(data) ? data : { events: [] };
  } catch (error) {
    if (error?.code !== "ENOENT") console.warn("Telegram statistika o'qish xatosi:", error?.message || error);
    return { events: [] };
  }
}

async function appendTelegramUsageEvent(event) {
  if (isTelegramAdminUser(event?.user)) return;
  telegramUsageStatsWriteChain = telegramUsageStatsWriteChain.then(async () => {
    const stats = await readTelegramUsageStats();
    const events = Array.isArray(stats.events) ? stats.events : [];
    events.push({
      at: new Date().toISOString(),
      ...event,
    });
    const kept = events.slice(-50000);
    await writeFile(TELEGRAM_USAGE_STATS_FILE, JSON.stringify({ events: kept }, null, 2), "utf8");
  }).catch((error) => {
    console.warn("Telegram statistika yozish xatosi:", error?.message || error);
  });
  return telegramUsageStatsWriteChain;
}

function summarizeTelegramUsageStats(stats) {
  const events = (Array.isArray(stats.events) ? stats.events : []).filter((event) => !isTelegramAdminUser(event?.user));
  const users = new Map();
  const agents = new Map();
  const days = new Map();
  const actions = new Map();
  let startClicks = 0;
  let detailSent = 0;
  let detailFailed = 0;
  let allClicks = 0;
  let photoSent = 0;
  let photoFailed = 0;
  let summarySent = 0;
  let warmQueued = 0;
  for (const event of events) {
    const action = cleanText(event.action || event.type || "event");
    actions.set(action, (actions.get(action) || 0) + 1);
    const day = cleanText(event.at).slice(0, 10);
    if (day) days.set(day, (days.get(day) || 0) + 1);
    const userId = cleanText(event.user?.id || event.userId);
    if (userId) {
      const current = users.get(userId) || {
        id: userId,
        username: "",
        name: "",
        isAdmin: false,
        starts: 0,
        allClicks: 0,
        agentClicks: 0,
        photosSent: 0,
        photosFailed: 0,
        lastAt: "",
      };
      const name = [event.user?.firstName, event.user?.lastName].map(cleanText).filter(Boolean).join(" ");
      current.username = cleanText(event.user?.username) || current.username;
      current.name = name || current.name;
      current.isAdmin = Boolean(event.user?.isAdmin || current.isAdmin);
      current.lastAt = event.at || current.lastAt;
      if (action === "start") current.starts += 1;
      if (event.sessionType === "all") current.allClicks += 1;
      if (event.sessionType !== "all" && (action === "start" || action === "detail_sent")) current.agentClicks += action === "start" ? 1 : 0;
      current.photosSent += Number(event.sent || 0);
      current.photosFailed += Number(event.failed || 0);
      users.set(userId, current);
    }
    const agentKey = [cleanText(event.date), cleanText(event.code)].filter(Boolean).join("#");
    if (agentKey) {
      const current = agents.get(agentKey) || {
        key: agentKey,
        date: cleanText(event.date),
        code: cleanText(event.code),
        agent: cleanText(event.agent),
        opens: 0,
        photosSent: 0,
        photosFailed: 0,
        lastAt: "",
      };
      current.agent = cleanText(event.agent) || current.agent;
      current.lastAt = event.at || current.lastAt;
      if (action === "start") current.opens += 1;
      current.photosSent += Number(event.sent || 0);
      current.photosFailed += Number(event.failed || 0);
      agents.set(agentKey, current);
    }
    if (action === "start") {
      startClicks += 1;
      if (event.sessionType === "all") allClicks += 1;
    }
    if (action === "detail_sent") {
      detailSent += 1;
      photoSent += Number(event.sent || 0);
      photoFailed += Number(event.failed || 0);
    }
    if (action === "detail_failed") detailFailed += 1;
    if (action === "summary_sent") summarySent += Number(event.groups || 0);
    if (action === "warm_cache_queued") warmQueued += Number(event.queued || 0);
  }
  return {
    admins: [...telegramAdminIds()],
    totals: {
      events: events.length,
      uniqueUsers: users.size,
      startClicks,
      allClicks,
      agentClicks: Math.max(0, startClicks - allClicks),
      detailSent,
      detailFailed,
      photoSent,
      photoFailed,
      summarySent,
      warmQueued,
    },
    actions: [...actions.entries()].map(([action, count]) => ({ action, count })).sort((a, b) => b.count - a.count),
    days: [...days.entries()].map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
    users: [...users.values()].sort((a, b) => String(b.lastAt).localeCompare(String(a.lastAt))).slice(0, 200),
    agents: [...agents.values()].sort((a, b) => b.opens - a.opens || String(b.lastAt).localeCompare(String(a.lastAt))).slice(0, 200),
    recent: events.slice(-300).reverse(),
  };
}

function telegramSessionToken(item) {
  const date = cleanText(item?.date);
  const code = cleanText(item?.code).toUpperCase();
  const brand = cleanText(item?.brandId || item?.brandCode || item?.brandName || brandFromCode(code).code).toUpperCase();
  const seed = [
    "agent-review-v2",
    brand,
    date,
    code,
    telegramSessionSecret(),
  ].join("#");
  return createHash("sha256").update(seed).digest("hex").slice(0, 22);
}

function legacyTelegramSessionToken(item) {
  const seed = [
    cleanText(item.date),
    cleanText(item.code),
    telegramSessionSecret(),
  ].join("#");
  return createHash("sha256").update(seed).digest("hex").slice(0, 22);
}

function telegramAllSessionToken(items) {
  const list = Array.isArray(items) ? items : [];
  const first = list[0] || {};
  const brand = brandFromItem(first);
  const dates = [...new Set(list.map((item) => cleanText(item.date)).filter(Boolean))].sort();
  const seed = [
    "agent-review-all-v2",
    brand.code,
    brand.name,
    dates.join(","),
    list.length,
    telegramSessionSecret(),
  ].join("#");
  return createHash("sha256").update(seed).digest("hex").slice(0, 22);
}

function legacyTelegramAllSessionTokens(items) {
  const list = Array.isArray(items) ? items : [];
  const first = list[0] || {};
  const brand = brandFromItem(first);
  const dates = [...new Set(list.map((item) => cleanText(item.date)).filter(Boolean))].sort();
  const date = dates.length === 1 ? dates[0] : dates.join(",");
  const seeds = [
    ["agent-review-all-v1", brand.code, brand.name, date, list.length, telegramSessionSecret()],
    ["agent-review-all", brand.code, date, telegramSessionSecret()],
    [date, brand.code, "ALL", telegramSessionSecret()],
    [date, "ALL", telegramSessionSecret()],
  ];
  return seeds.map((parts) => createHash("sha256").update(parts.join("#")).digest("hex").slice(0, 22));
}

function createTelegramAgentSession(group, token, createdAt, extra = {}) {
  return {
    token,
    createdAt,
    date: group.date,
    code: group.code,
    agent: group.agent,
    brandId: group.brandId,
    brandCode: group.brandCode,
    brandName: group.brandName,
    items: group.items,
    opened: [],
    ...extra,
  };
}

function createTelegramAllSession(groups, token, createdAt, extra = {}) {
  const items = groups.flatMap((group) => Array.isArray(group.items) ? group.items : []);
  const first = items[0] || groups[0] || {};
  const brand = brandFromItem(first);
  const dates = [...new Set(items.map((item) => cleanText(item.date)).filter(Boolean))].sort();
  return {
    token,
    type: "all",
    createdAt,
    date: dates.length === 1 ? dates[0] : dates.join(", "),
    code: "ALL",
    agent: `${groups.length} agent`,
    brandId: cleanText(first.brandId),
    brandCode: cleanText(first.brandCode || brand.code),
    brandName: brand.name,
    items,
    opened: [],
    ...extra,
  };
}

function groupSuspiciousByAgent(items) {
  const groups = new Map();
  for (const item of items || []) {
    const key = groupKey(item);
    if (!groups.has(key)) {
      groups.set(key, {
        date: cleanText(item.date),
        code: cleanText(item.code),
        agent: cleanText(item.agent),
        brandId: cleanText(item.brandId),
        brandCode: cleanText(item.brandCode),
        brandName: cleanText(item.brandName),
        items: [],
      });
    }
    groups.get(key).items.push(item);
  }
  return [...groups.values()].sort((a, b) => (
    String(a.date).localeCompare(String(b.date))
    || String(a.code).localeCompare(String(b.code))
  ));
}

let telegramBotInfoCache = null;

async function telegramBotInfo() {
  if (telegramBotInfoCache?.username) return telegramBotInfoCache;
  const info = await telegramRequest("getMe", {});
  telegramBotInfoCache = info || {};
  return telegramBotInfoCache;
}

function telegramSummaryText(groups, botUsername, partIndex = 0, totalParts = 1, allToken = "") {
  const first = groups[0] || {};
  const brand = brandFromItem(first);
  const dates = [...new Set(groups.map((group) => cleanText(group.date)).filter(Boolean))];
  const totalPhotos = groups.reduce((sum, group) => sum + group.items.length, 0);
  const totalText = `Yaroqsiz fotolar: ${totalPhotos} ta`;
  const totalLine = allToken
    ? `<a href="${telegramHtml(`https://t.me/${botUsername}?start=review_${allToken}`)}">${telegramHtml(totalText)}</a>`
    : totalText;
  const lines = [
    `\u{1F6A9}${telegramHtml(brand.name)}${dates.length === 1 ? ` | ${telegramHtml(dates[0])}` : ""}`,
    totalLine,
    `Agentlar: ${groups.length} ta${totalParts > 1 ? ` | ${partIndex + 1}/${totalParts}` : ""}`,
    "",
    ...groups.map((group, index) => {
      const agentName = agentDisplayName(group.agent) || group.agent || group.code;
      const url = `https://t.me/${botUsername}?start=review_${group.token}`;
      return `${index + 1}. ${telegramHtml(group.code)}  -  ${group.items.length} ta\n    <a href="${telegramHtml(url)}">${telegramHtml(agentName)}</a>`;
    }),
  ];
  return lines.join("\n");
}

async function sendSuspiciousSummaryToTelegram(items, targetChatId) {
  const chatId = await resolveTelegramChatIdForItems(items, targetChatId);
  const threadId = process.env.TELEGRAM_THREAD_ID ? Number(process.env.TELEGRAM_THREAD_ID) : undefined;
  if (!chatId) throw new Error("TELEGRAM_CHAT_ID sozlanmagan");
  if (!Array.isArray(items) || items.length === 0) throw new Error("Yuboriladigan shubhali foto yo'q");

  const bot = await telegramBotInfo();
  if (!bot.username) throw new Error("Bot username aniqlanmadi. TELEGRAM_BOT_TOKEN ni tekshiring.");

  const sessions = await readTelegramSessions();
  const groups = groupSuspiciousByAgent(items);
  const createdAt = new Date().toISOString();
  const sessionGroups = groups.map((group) => {
    const token = telegramSessionToken(group.items[0] || group);
    const session = createTelegramAgentSession(group, token, createdAt);
    sessions[token] = session;
    const legacyToken = legacyTelegramSessionToken(group.items[0] || group);
    if (legacyToken !== token) sessions[legacyToken] = { ...session, token: legacyToken, aliasOf: token };
    return { ...group, token };
  });
  const allItems = sessionGroups.flatMap((group) => group.items);
  const allToken = telegramAllSessionToken(allItems);
  const allSession = createTelegramAllSession(sessionGroups, allToken, createdAt);
  sessions[allToken] = allSession;
  for (const legacyAllToken of legacyTelegramAllSessionTokens(allItems)) {
    if (legacyAllToken && legacyAllToken !== allToken) {
      sessions[legacyAllToken] = { ...allSession, token: legacyAllToken, aliasOf: allToken };
    }
  }
  await writeTelegramSessions(sessions);

  const sent = [];
  const failed = [];
  const chunks = [sessionGroups];
  const warmCache = await enqueueTelegramWarmCache(sessionGroups.flatMap((group) => group.items), chatId);
  if (warmCache.enabled && warmCache.queued) {
    appendTelegramUsageEvent({
      action: "warm_cache_queued",
      queued: warmCache.queued,
      photos: sessionGroups.reduce((sum, group) => sum + group.items.length, 0),
      groups: sessionGroups.length,
    });
  }

  for (const [chunkIndex, chunk] of chunks.entries()) {
    const text = telegramSummaryText(chunk, bot.username, chunkIndex, chunks.length, allToken);
    try {
      const message = await telegramRequest("sendMessage", {
        chat_id: chatId,
        ...(threadId ? { message_thread_id: threadId } : {}),
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });
      await telegramPause();
      appendTelegramUsageEvent({
        action: "summary_sent",
        chatId: maskChatId(chatId),
        groups: chunk.length,
        photos: chunk.reduce((sum, group) => sum + group.items.length, 0),
        messageId: message.message_id,
      });
      for (const group of chunk) {
        sent.push(...group.items.map((item) => ({
          code: item.code,
          photo: item.photo,
          token: group.token,
          summary_message_id: message.message_id,
          mode: "summary",
        })));
      }
    } catch (error) {
      for (const group of chunk) {
        failed.push(...group.items.map((item) => ({
          code: item.code,
          photo: item.photo,
          token: group.token,
          error: String(error.message || error),
          mode: "summary",
        })));
      }
    }
  }

  return { sent, failed, batches: chunks.length, groups: sessionGroups.length, mode: "summary", warmCache };
}

async function telegramMultipartRequest(method, form, options = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN sozlanmagan");

  const maxAttempts = Number(options.maxAttempts || 3);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      body: form,
    });

    const json = await res.json().catch(() => ({}));

    if (res.ok && json.ok !== false) return json.result;

    const errorText = telegramErrorText(json, method);
    const retryAfter = Number(
      json?.parameters?.retry_after ||
      errorText.match(/retry after (\d+)/i)?.[1] ||
      0
    );

    if ((res.status === 429 || /Too Many Requests/i.test(errorText)) && retryAfter && attempt < maxAttempts) {
      await sleep((retryAfter + 1) * 1000);
      continue;
    }

    throw new Error(errorText);
  }

  throw new Error(`Telegram ${method} xatosi`);
}

async function sendPhotoByUpload(item, chatId, threadId, caption, options = {}) {
  const photo = await proxyPhoto(item.url);
  const blob = new Blob([photo.data], { type: photo.contentType || "image/jpeg" });

  const rawName = cleanText(item.photo).replace(/[^\w.-]+/g, "_") || "photo";
  const safeName = /\.[a-z0-9]+$/i.test(rawName) ? rawName : `${rawName}.jpg`;

  const form = new FormData();
  form.append("chat_id", String(chatId));

  if (threadId) {
    form.append("message_thread_id", String(threadId));
  }

  if (options.disableNotification) {
    form.append("disable_notification", "true");
  }

  if (caption) {
    form.append("caption", caption);
  }
  form.append("photo", blob, safeName);

  const result = await telegramMultipartRequest("sendPhoto", form);
  await telegramPause();
  await rememberTelegramFileId(item, bestTelegramPhotoFileId(result), "upload");

  return {
    code: item.code,
    photo: item.photo,
    message_id: result.message_id,
    uploaded: true,
  };
}
async function sendMediaGroupByUpload(chunkItems, chatId, threadId, caption) {
  const form = new FormData();

  form.append("chat_id", String(chatId));

  if (threadId) {
    form.append("message_thread_id", String(threadId));
  }

  const media = [];

  for (let index = 0; index < chunkItems.length; index += 1) {
    const item = chunkItems[index];
    const photo = await proxyPhoto(item.url);
    const blob = new Blob([photo.data], { type: photo.contentType || "image/jpeg" });

    const rawName = cleanText(item.photo).replace(/[^\w.-]+/g, "_") || `photo_${index}`;
    const safeName = /\.[a-z0-9]+$/i.test(rawName) ? rawName : `${rawName}.jpg`;
    const attachName = `photo${index}`;

    form.append(attachName, blob, safeName);

    media.push({
      type: "photo",
      media: `attach://${attachName}`,
      ...(index === 0 && caption ? { caption } : {}),
    });
  }

  form.append("media", JSON.stringify(media));

  const results = await telegramMultipartRequest("sendMediaGroup", form);
  await telegramPause();
  await rememberTelegramMediaResults(chunkItems, results, "upload");

  const messageId = Array.isArray(results) ? results[0]?.message_id : undefined;

  return chunkItems.map((item) => ({
    code: item.code,
    photo: item.photo,
    message_id: messageId,
    grouped: true,
    uploaded: true,
  }));
}

async function sendSingleSuspiciousItem(item, chatId, threadId) {
  if (!item?.url || !/^https?:\/\//i.test(item.url)) {
    throw new Error("Foto URL noto'g'ri");
  }
  const caption = telegramCaptionV2(item);
  const cachedFileId = await cachedTelegramFileId(item);
  if (cachedFileId) {
    try {
      const result = await telegramRequest("sendPhoto", {
        chat_id: chatId,
        ...(threadId ? { message_thread_id: threadId } : {}),
        photo: cachedFileId,
        caption,
      });
      await telegramPause();
      await rememberTelegramFileId(item, bestTelegramPhotoFileId(result) || cachedFileId, "file_id");
      return { code: item.code, photo: item.photo, message_id: result.message_id, cached: true };
    } catch {
      await forgetTelegramFileId(item);
      // Cached file_id can expire or be invalid for another bot; upload the photo bytes instead.
    }
  }
  try {
    return await sendPhotoByUpload(item, chatId, threadId, caption);
  } catch (error) {
    throw new Error(String(error.message || error));
  }
}

async function sendChunkItemsIndividually(chunkItems, chatId, threadId, groupError = "") {
  const sent = [];
  const failed = [];
  for (const item of chunkItems) {
    try {
      sent.push(await sendSingleSuspiciousItem(item, chatId, threadId));
    } catch (error) {
      failed.push({
        code: item.code,
        photo: item.photo,
        error: [groupError, String(error.message || error)].filter(Boolean).join(" | "),
        grouped: false,
      });
    }
  }
  return { sent, failed };
}

async function sendGroupedSuspiciousItems(items, chatId, threadId) {
  const agentGroups = groupSuspiciousByAgent(items);
  if (agentGroups.length > 1) {
    const sent = [];
    const failed = [];
    for (const group of agentGroups) {
      const result = await sendGroupedSuspiciousItems(group.items, chatId, threadId);
      sent.push(...result.sent);
      failed.push(...result.failed);
    }
    return { sent, failed };
  }

  const invalid = items.filter((item) => !item?.url || !/^https?:\/\//i.test(item.url));
  const validItems = items.filter((item) => item?.url && /^https?:\/\//i.test(item.url));

  const sent = [];
  const failed = invalid.map((item) => ({
    code: item.code,
    photo: item.photo,
    error: "Foto URL noto'g'ri",
    grouped: false,
  }));
  const chunks = [];
  for (let index = 0; index < validItems.length; index += 10) {
    chunks.push(validItems.slice(index, index + 10));
  }

  const concurrency = Math.max(1, Math.min(5, Number(process.env.TELEGRAM_MEDIA_CONCURRENCY || 1) || 1));
  const chunkResults = await mapWithConcurrency(chunks, concurrency, async (chunkItems) => {
    const caption = groupedTelegramCaption(chunkItems);
    const cachedIds = await Promise.all(chunkItems.map((item) => cachedTelegramFileId(item)));
    if (cachedIds.every(Boolean)) {
      try {
        const results = await telegramRequest("sendMediaGroup", {
          chat_id: chatId,
          ...(threadId ? { message_thread_id: threadId } : {}),
          media: chunkItems.map((item, itemIndex) => ({
            type: "photo",
            media: cachedIds[itemIndex],
            ...(caption && itemIndex === 0 ? { caption } : {}),
          })),
        });

        await telegramPause();
        await rememberTelegramMediaResults(chunkItems, results, "file_id");

        const messageId = Array.isArray(results) ? results[0]?.message_id : undefined;

        return {
          sent: chunkItems.map((item) => ({
            code: item.code,
            photo: item.photo,
            message_id: messageId,
            grouped: true,
            cached: true,
          })),
          failed: [],
        };
      } catch (error) {
        await Promise.all(chunkItems.map((item, index) => cachedIds[index] ? forgetTelegramFileId(item) : Promise.resolve()));
        console.warn("Telegram cached file_id group xatosi, upload qilinadi:", error?.message || error);
      }
    }
    try {
      const uploadedResults = await sendMediaGroupByUpload(chunkItems, chatId, threadId, caption);
      return { sent: uploadedResults, failed: [] };
    } catch (error) {
      try {
        const fallback = await sendChunkItemsIndividually(chunkItems, chatId, threadId, `Media group xatosi: ${String(error.message || error)}`);
        return fallback;
      } catch (fallbackError) {
        return {
          sent: [],
          failed: chunkItems.map((item) => ({
            code: item.code,
            photo: item.photo,
            error: String(fallbackError.message || error.message || error),
            grouped: false,
          })),
        };
      }
    }
  });

  for (const result of chunkResults) {
    if (Array.isArray(result)) {
      sent.push(...result);
      continue;
    }
    sent.push(...(result?.sent || []));
    failed.push(...(result?.failed || []));
  }

  return { sent, failed };
}

async function sendSuspiciousToTelegram(items) {
  return sendSuspiciousToTelegramChat(items, process.env.TELEGRAM_CHAT_ID);
}

function telegramChats() {
  return [
    { id: cleanText(process.env.TELEGRAM_CHAT_ID), name: "Asosiy gruppa" },
    { id: "-1002547865945", name: "LALAKU MAMA TABEL" },
  ].filter((chat, index, list) => chat.id && list.findIndex((item) => item.id === chat.id) === index);
}

function maskChatId(chatId) {
  return String(chatId || "").replace(/.(?=.{4})/g, "*");
}

function resolveTelegramChatId(chatId) {
  const requested = cleanText(chatId);
  if (requested) return requested;
  const chats = telegramChats();
  const selected = chats[0];
  if (!selected) throw new Error("Telegram gruppa tanlovi noto'g'ri");
  return selected.id;
}

async function resolveTelegramChatIdForItems(items, targetChatId) {
  const requested = cleanText(targetChatId);
  if (requested) return requested;
  const first = Array.isArray(items) ? (items[0] || {}) : {};
  const config = await loadBrandsConfig({ includeDisabled: true }).catch(() => ({ brands: [] }));
  const candidates = [
    first.brandId,
    first.brandName,
    first.brandCode,
    first.code,
  ].map(cleanText).filter(Boolean);
  for (const value of candidates) {
    const brand = findBrand(config, value, { includeDisabled: true });
    if (cleanText(brand?.telegramChatId)) return cleanText(brand.telegramChatId);
  }
  const byPrefix = (config.brands || []).find((brand) => (
    (brand.agentPrefixes || []).some((prefix) => cleanText(first.code).toUpperCase().startsWith(cleanText(prefix).toUpperCase()))
  ));
  if (cleanText(byPrefix?.telegramChatId)) return cleanText(byPrefix.telegramChatId);
  return resolveTelegramChatId("");
}

async function telegramSuspiciousPreview(items, targetChatId) {
  if (!Array.isArray(items) || items.length === 0) throw apiError("Tekshiriladigan foto yo'q", 400);
  const groups = groupSuspiciousByAgent(items);
  const chatId = await resolveTelegramChatIdForItems(items, targetChatId);
  const validPhotos = items.filter((item) => /^https?:\/\//i.test(cleanText(item?.url))).length;
  const dates = [...new Set(items.map((item) => cleanText(item?.date)).filter(Boolean))].sort();
  const first = items[0] || {};
  const brand = brandFromItem(first);
  return {
    chatId: maskChatId(chatId),
    brand: brand.name,
    dates,
    photos: items.length,
    validPhotos,
    invalidPhotos: items.length - validPhotos,
    agents: groups.length,
    groups: groups.map((group) => ({
      code: group.code,
      agent: agentDisplayName(group.agent) || group.agent || group.code,
      date: group.date,
      photos: group.items.length,
      token: telegramSessionToken(group.items[0] || group),
    })),
  };
}

async function sendSuspiciousToTelegramChat(items, targetChatId) {
  const chatId = await resolveTelegramChatIdForItems(items, targetChatId);
  const threadId = process.env.TELEGRAM_THREAD_ID ? Number(process.env.TELEGRAM_THREAD_ID) : undefined;
  if (!chatId) throw new Error("TELEGRAM_CHAT_ID sozlanmagan");
  if (!Array.isArray(items) || items.length === 0) throw new Error("Yuboriladigan shubhali foto yo'q");

  const sent = [];
  const failed = [];
  const batches = [];
  for (let index = 0; index < items.length; index += 100) {
    batches.push(items.slice(index, index + 100));
  }

  for (const batch of batches) {
    const groups = new Map();
    for (const item of batch) {
      const key = groupKey(item);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }

    for (const groupItems of groups.values()) {
      if (groupItems.length > 1) {
        try {
          const result = await sendGroupedSuspiciousItems(groupItems, chatId, threadId);
          sent.push(...result.sent);
          failed.push(...result.failed);
        } catch (error) {
          for (const item of groupItems) {
            failed.push({ code: item.code, photo: item.photo, error: String(error.message || error), grouped: true });
          }
        }
        continue;
      }

      for (const item of groupItems) {
        try {
          sent.push(await sendSingleSuspiciousItem(item, chatId, threadId));
        } catch (error) {
          failed.push({ code: item.code, photo: item.photo, error: String(error.message || error) });
        }
      }
    }
  }
  return { sent, failed, batches: batches.length };
}

async function sendReviewSessionDetails(session, chatId) {
  const items = Array.isArray(session?.items) ? session.items : [];
  if (!items.length) throw new Error("Bu agent uchun foto topilmadi");
  const first = items[0] || {};
  const brand = brandFromItem(first.code ? first : session);
  const isAllSession = session?.type === "all";
  const agentGroups = isAllSession ? groupSuspiciousByAgent(items) : [];

  const title = [
    `\u{1F6A9} ${brand.name} | ${cleanText(session.date)}`,
    isAllSession
      ? `Barcha agentlar: ${agentGroups.length} ta`
      : `${agentDisplayName(session.agent) || cleanText(session.agent) || cleanText(session.code)}`,
    `Yaroqsiz foto: ${items.length} ta`,
  ].filter(Boolean).join("\n");

  await telegramRequest("sendMessage", {
    chat_id: chatId,
    text: title,
    disable_web_page_preview: true,
  });
  await telegramPause();

  const sent = [];
  const failed = [];
  if (isAllSession) {
    for (const group of agentGroups) {
      try {
        telegramRequest("sendChatAction", { chat_id: chatId, action: "upload_photo" }, { maxAttempts: 1 }).catch(() => { });
        const result = group.items.length > 1
          ? await sendGroupedSuspiciousItems(group.items, chatId, null)
          : { sent: [await sendSingleSuspiciousItem(group.items[0], chatId, null)], failed: [] };
        sent.push(...result.sent);
        failed.push(...result.failed);
      } catch (error) {
        const fallback = await sendChunkItemsIndividually(
          group.items,
          chatId,
          null,
          `Agent group xatosi: ${String(error.message || error)}`
        );
        sent.push(...fallback.sent);
        failed.push(...fallback.failed);
      }
    }
  } else {
    try {
      if (items.length > 1) {
        const result = await sendGroupedSuspiciousItems(items, chatId, null);
        sent.push(...result.sent);
        failed.push(...result.failed);
      } else {
        sent.push(await sendSingleSuspiciousItem(items[0], chatId, null));
      }
    } catch (error) {
      failed.push(...items.map((item) => ({
        code: item.code,
        photo: item.photo,
        error: String(error.message || error),
      })));
    }
  }
  return { sent, failed };
}

let telegramPollingStarted = false;
let telegramPollingOffset = 0;
const telegramDetailQueue = [];
let telegramDetailActive = 0;
let telegramSessionsWriteChain = Promise.resolve();

async function updateTelegramSession(token, updater) {
  telegramSessionsWriteChain = telegramSessionsWriteChain.then(async () => {
    const sessions = await readTelegramSessions();
    const session = sessions[token];
    if (!session) return;
    const next = await updater(session, sessions);
    sessions[token] = next || session;
    await writeTelegramSessions(sessions);
  }).catch((error) => {
    console.error("Telegram session yozish xatosi:", error?.message || error);
  });
  return telegramSessionsWriteChain;
}

async function processTelegramDetailJob(job) {
  const { token, session, chatId, user } = job;
  try {
    telegramRequest("sendChatAction", { chat_id: chatId, action: "upload_photo" }, { maxAttempts: 1 }).catch(() => { });
    const result = await sendReviewSessionDetails(session, chatId);
    if (result.failed.length) {
      console.warn(`Telegram detail qisman yuborildi: sent=${result.sent.length}, failed=${result.failed.length}, first=${result.failed[0]?.error || ""}`);
    }
    await updateTelegramSession(token, (latest) => {
      const opened = Array.isArray(latest.opened) ? latest.opened : [];
      opened.push({
        chatId,
        at: new Date().toISOString(),
        sent: result.sent.length,
        failed: result.failed.length,
      });
      return { ...latest, opened };
    });
    appendTelegramUsageEvent({
      action: "detail_sent",
      token,
      chatId,
      user,
      sessionType: session.type === "all" ? "all" : "agent",
      date: session.date,
      code: session.code,
      agent: session.agent,
      sent: result.sent.length,
      failed: result.failed.length,
    });
  } catch (error) {
    console.error("Telegram detail yuborish xatosi:", error?.message || error);
    appendTelegramUsageEvent({
      action: "detail_failed",
      token,
      chatId,
      user,
      sessionType: session.type === "all" ? "all" : "agent",
      date: session.date,
      code: session.code,
      agent: session.agent,
      error: String(error?.message || error),
    });
    try {
      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: `Foto yuborishda xato: ${String(error?.message || error).slice(0, 500)}`,
        disable_web_page_preview: true,
      }, { maxAttempts: 1 });
    } catch {
      // Private chat error is already logged above.
    }
  }
}

function pumpTelegramDetailQueue() {
  const limit = telegramDetailConcurrency();
  while (telegramDetailActive < limit && telegramDetailQueue.length) {
    const job = telegramDetailQueue.shift();
    telegramDetailActive += 1;
    processTelegramDetailJob(job).finally(() => {
      telegramDetailActive -= 1;
      pumpTelegramDetailQueue();
    });
  }
}

function enqueueTelegramDetail(session, chatId, token, user = null) {
  telegramDetailQueue.push({ session, chatId, token, user, queuedAt: Date.now() });
  pumpTelegramDetailQueue();
}

function resolveTelegramStoredSession(token, sessions) {
  const session = sessions?.[token];
  if (!session) return null;
  if (session.aliasOf && sessions?.[session.aliasOf]) {
    return { token: session.aliasOf, session: sessions[session.aliasOf] };
  }
  return { token, session };
}

async function readTelegramRecoveryItems() {
  let items = [];
  try {
    const data = await readSuspiciousPhotos();
    items = Array.isArray(data.items) ? data.items : [];
  } catch (error) {
    console.warn("Telegram recovery suspicious o'qish xatosi:", error?.message || error);
  }
  const byKey = new Map();
  for (const item of items) {
    byKey.set(item.key || itemKey(item), item);
  }
  try {
    const marks = await readReviewMarks();
    for (const [key, mark] of Object.entries(marks)) {
      const item = suspiciousPhotoFromMark(key, mark);
      if (item) byKey.set(item.key || key || itemKey(item), item);
    }
  } catch (error) {
    console.warn("Telegram recovery marks o'qish xatosi:", error?.message || error);
  }
  return [...byKey.values()].filter((item) => (
    item?.url
    && /^https?:\/\//i.test(item.url)
    && String(item.verdict || "MINUS").toUpperCase() === "MINUS"
  ));
}

function addTelegramAgentSessionAliases(sessions, group, createdAt, extra = {}) {
  const token = telegramSessionToken(group.items[0] || group);
  const session = createTelegramAgentSession(group, token, createdAt, extra);
  sessions[token] = session;
  const legacyToken = legacyTelegramSessionToken(group.items[0] || group);
  if (legacyToken !== token) sessions[legacyToken] = { ...session, token: legacyToken, aliasOf: token };
  return { token, session, aliases: [token, legacyToken] };
}

function addTelegramAllSessionAliases(sessions, groups, createdAt, extra = {}) {
  const items = groups.flatMap((group) => Array.isArray(group.items) ? group.items : []);
  const token = telegramAllSessionToken(items);
  const session = createTelegramAllSession(groups, token, createdAt, extra);
  sessions[token] = session;
  const aliases = [token];
  for (const legacyToken of legacyTelegramAllSessionTokens(items)) {
    if (legacyToken && legacyToken !== token) {
      sessions[legacyToken] = { ...session, token: legacyToken, aliasOf: token };
      aliases.push(legacyToken);
    }
  }
  return { token, session, aliases };
}

async function recoverTelegramSessionByToken(token, sessions) {
  const target = cleanText(token).toLowerCase();
  if (!/^[a-f0-9]{12,40}$/i.test(target)) return null;

  const items = await readTelegramRecoveryItems();
  if (!items.length) return null;

  const createdAt = new Date().toISOString();
  const recoveredExtra = { recoveredAt: createdAt };
  const groups = groupSuspiciousByAgent(items);

  try {
    const stats = await readTelegramUsageStats();
    const hint = (Array.isArray(stats.events) ? stats.events : [])
      .slice()
      .reverse()
      .find((event) => cleanText(event?.token).toLowerCase() === target && (event?.date || event?.code));
    if (hint?.date && hint?.code && cleanText(hint.code).toUpperCase() !== "ALL") {
      const group = groups.find((candidate) => (
        cleanText(candidate.date) === cleanText(hint.date)
        && cleanText(candidate.code).toUpperCase() === cleanText(hint.code).toUpperCase()
      ));
      if (group) {
        const result = addTelegramAgentSessionAliases(sessions, group, createdAt, {
          ...recoveredExtra,
          recoveredFrom: "usage_stats",
        });
        if (target !== result.token) sessions[target] = { ...result.session, token: target, aliasOf: result.token };
        await writeTelegramSessions(sessions);
        return { token: result.token, session: result.session, recovered: true };
      }
    }
    if (hint?.date && (hint?.sessionType === "all" || cleanText(hint.code).toUpperCase() === "ALL")) {
      const buckets = new Map();
      for (const item of items.filter((candidate) => cleanText(candidate.date) === cleanText(hint.date))) {
        const brand = brandFromItem(item);
        const key = [brand.code, brand.name, cleanText(item.date)].join("#");
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(item);
      }
      const expectedPhotos = Number(hint.photos || 0);
      const bucketItems = [...buckets.values()].find((list) => expectedPhotos && list.length === expectedPhotos)
        || (buckets.size === 1 ? [...buckets.values()][0] : null);
      if (bucketItems?.length) {
        const result = addTelegramAllSessionAliases(sessions, groupSuspiciousByAgent(bucketItems), createdAt, {
          ...recoveredExtra,
          recoveredFrom: "usage_stats",
        });
        if (target !== result.token) sessions[target] = { ...result.session, token: target, aliasOf: result.token };
        await writeTelegramSessions(sessions);
        return { token: result.token, session: result.session, recovered: true };
      }
    }
  } catch (error) {
    console.warn("Telegram recovery usage stats xatosi:", error?.message || error);
  }

  for (const group of groups) {
    const candidateToken = telegramSessionToken(group.items[0] || group);
    const legacyToken = legacyTelegramSessionToken(group.items[0] || group);
    const aliases = [candidateToken, legacyToken];
    if (aliases.some((alias) => String(alias).toLowerCase() === target)) {
      const result = addTelegramAgentSessionAliases(sessions, group, createdAt, recoveredExtra);
      await writeTelegramSessions(sessions);
      return { token: result.token, session: result.session, recovered: true };
    }
  }

  const allBuckets = new Map();
  for (const item of items) {
    const brand = brandFromItem(item);
    const key = [brand.code, brand.name, cleanText(item.date)].join("#");
    if (!allBuckets.has(key)) allBuckets.set(key, []);
    allBuckets.get(key).push(item);
  }

  for (const bucketItems of allBuckets.values()) {
    const groups = groupSuspiciousByAgent(bucketItems);
    const candidateToken = telegramAllSessionToken(bucketItems);
    const aliases = [candidateToken, ...legacyTelegramAllSessionTokens(bucketItems)];
    if (aliases.some((alias) => String(alias).toLowerCase() === target)) {
      const result = addTelegramAllSessionAliases(sessions, groups, createdAt, recoveredExtra);
      await writeTelegramSessions(sessions);
      return { token: result.token, session: result.session, recovered: true };
    }
  }

  return null;
}

async function repairTelegramSessionsFromUsageStats() {
  const stats = await readTelegramUsageStats();
  const events = Array.isArray(stats.events) ? stats.events : [];
  const useful = new Map();
  for (const event of events) {
    const token = cleanText(event?.token).toLowerCase();
    if (!/^[a-f0-9]{12,40}$/i.test(token)) continue;
    if (!event?.date || !event?.code) continue;
    if (event.action !== "start" && event.action !== "detail_sent") continue;
    const prev = useful.get(token);
    if (
      !prev
      || (!Number(prev.photos || 0) && Number(event.photos || 0))
      || (prev.action !== "start" && event.action === "start")
    ) {
      useful.set(token, event);
    }
  }
  if (!useful.size) return { repaired: 0 };

  const items = await readTelegramRecoveryItems();
  if (!items.length) return { repaired: 0 };

  const groups = groupSuspiciousByAgent(items);
  const sessions = await readTelegramSessions();
  const createdAt = new Date().toISOString();
  let repaired = 0;

  for (const [token, event] of useful.entries()) {
    if (resolveTelegramStoredSession(token, sessions)) continue;
    const code = cleanText(event.code).toUpperCase();
    const date = cleanText(event.date);
    if (code && code !== "ALL") {
      const group = groups.find((candidate) => (
        cleanText(candidate.date) === date
        && cleanText(candidate.code).toUpperCase() === code
      ));
      if (!group) continue;
      const result = addTelegramAgentSessionAliases(sessions, group, createdAt, {
        recoveredAt: createdAt,
        recoveredFrom: "usage_stats_startup",
      });
      if (token !== result.token) sessions[token] = { ...result.session, token, aliasOf: result.token };
      repaired += 1;
      continue;
    }
    if (event.sessionType === "all" || code === "ALL") {
      const buckets = new Map();
      for (const item of items.filter((candidate) => cleanText(candidate.date) === date)) {
        const brand = brandFromItem(item);
        const key = [brand.code, brand.name, cleanText(item.date)].join("#");
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(item);
      }
      const expectedPhotos = Number(event.photos || 0);
      const bucketItems = [...buckets.values()].find((list) => expectedPhotos && list.length === expectedPhotos)
        || (buckets.size === 1 ? [...buckets.values()][0] : null);
      if (!bucketItems?.length) continue;
      const result = addTelegramAllSessionAliases(sessions, groupSuspiciousByAgent(bucketItems), createdAt, {
        recoveredAt: createdAt,
        recoveredFrom: "usage_stats_startup",
      });
      if (token !== result.token) sessions[token] = { ...result.session, token, aliasOf: result.token };
      repaired += 1;
    }
  }

  if (repaired) await writeTelegramSessions(sessions);
  return { repaired };
}

async function handleTelegramUpdate(update) {
  const message = update?.message;
  const text = cleanText(message?.text);
  const chatId = message?.chat?.id;
  const token = text.match(/^\/start(?:@\w+)?\s+review_([a-f0-9]{12,40})/i)?.[1];
  if (!chatId) return;
  const user = telegramUserFromMessage(message);
  if (!token) {
    if (/^\/start(?:@\w+)?$/i.test(text)) {
      appendTelegramUsageEvent({ action: "plain_start", chatId, user });
      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: "Fotolarni olish uchun guruhdagi kerakli agent qatoridagi linkni bosing.",
      });
    }
    return;
  }

  const sessions = await readTelegramSessions();
  let resolved = resolveTelegramStoredSession(token, sessions);
  if (!resolved) {
    resolved = await recoverTelegramSessionByToken(token, sessions);
    if (resolved?.recovered) {
      appendTelegramUsageEvent({
        action: "start_recovered_session",
        token: resolved.token,
        requestedToken: token,
        chatId,
        user,
      });
    }
  }
  const session = resolved?.session;
  if (!session) {
    appendTelegramUsageEvent({
      action: "start_missing_session",
      token,
      chatId,
      user,
    });
    await telegramRequest("sendMessage", {
      chat_id: chatId,
      text: "Bu link topilmadi. Guruhdagi agent qatoridan yangi linkni bosing.",
    });
    return;
  }

  appendTelegramUsageEvent({
    action: "start",
    token: resolved.token,
    chatId,
    user,
    sessionType: session.type === "all" ? "all" : "agent",
    date: session.date,
    code: session.code,
    agent: session.agent,
    photos: Array.isArray(session.items) ? session.items.length : 0,
  });
  enqueueTelegramDetail(session, chatId, resolved.token, user);
}

async function pollTelegramUpdatesOnce() {
  const updates = await telegramRequest("getUpdates", {
    offset: telegramPollingOffset ? telegramPollingOffset + 1 : undefined,
    timeout: 20,
    allowed_updates: ["message"],
  }, { maxAttempts: 1 });
  const list = updates || [];
  for (const update of list) {
    telegramPollingOffset = Math.max(telegramPollingOffset, Number(update.update_id || 0));
  }
  await Promise.all(list.map(async (update) => {
    try {
      await handleTelegramUpdate(update);
    } catch (error) {
      console.error("Telegram update xatosi:", error?.message || error);
    }
  }));
}

function startTelegramBotPolling() {
  if (telegramPollingStarted) return;
  if (!process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_POLLING === "0") return;
  telegramPollingStarted = true;
  let failureCount = 0;
  const loop = async () => {
    let nextDelay = 250;
    try {
      await pollTelegramUpdatesOnce();
      failureCount = 0;
    } catch (error) {
      failureCount += 1;
      nextDelay = Math.min(60_000, 2_000 * (2 ** Math.min(failureCount - 1, 5)));
      if (failureCount <= 3 || failureCount % 10 === 0) {
        console.error(`Telegram polling xatosi (${failureCount}), ${Math.round(nextDelay / 1000)}s dan keyin qayta urinadi:`, error?.message || error);
      }
    } finally {
      if (telegramPollingStarted) setTimeout(loop, nextDelay).unref?.();
    }
  };
  setTimeout(loop, 1000).unref?.();
}

function openBrowser(url) {
  if (process.env.NO_OPEN === "1") return;
  if (process.env.OPEN_BROWSER === "0") return;
  const fallbackPaths = process.platform === "win32"
    ? [
      process.env.BROWSER_PATH,
      process.env.CHROME_PATH,
      join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      join(process.env.LOCALAPPDATA || "", "Microsoft", "Edge", "Application", "msedge.exe"),
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    ].filter(Boolean)
    : [];
  const fallback = fallbackPaths.find((path) => existsSync(path));
  const commands = process.platform === "win32"
    ? [
      `start "" "${url}"`,
      ...(fallback ? [`start "" "${fallback}" "${url}"`] : []),
    ]
    : process.platform === "darwin"
      ? [`open "${url}"`]
      : [`xdg-open "${url}"`, `sensible-browser "${url}"`];
  const run = (index = 0) => {
    if (!commands[index]) {
      console.log(`Brauzer avtomatik ochilmadi. Linkni qo'lda oching: ${url}`);
      return;
    }
    exec(commands[index], { windowsHide: true }, (error) => {
      if (error) run(index + 1);
    });
  };
  run();
}

await loadEnv();

// Railway (DATA_DIR o'rnatilgan) uchun: Volume papkalarini yaratamiz va bo'sh
// bo'lsa image ichidagi brend konfiguratsiyasini ko'chiramiz. Lokalda
// (DATA_ROOT===ROOT) hech narsa o'zgarmaydi — fayllar joyida bo'ladi.
async function seedDataDir() {
  if (DATA_ROOT === ROOT) return;
  try {
    await mkdir(DATA_OUTPUTS, { recursive: true });
    await mkdir(join(DATA_ROOT, "data", "attendance"), { recursive: true });
    await mkdir(join(DATA_ROOT, "config"), { recursive: true });
    if (!existsSync(BRANDS_FILE) && existsSync(BRANDS_SEED_FILE)) {
      await copyFile(BRANDS_SEED_FILE, BRANDS_FILE);
      console.log(`Seed: brendlar konfiguratsiyasi Volume'ga ko'chirildi (${BRANDS_FILE})`);
    }
    console.log(`Ma'lumotlar papkasi: ${DATA_ROOT}`);
  } catch (error) {
    console.warn("Seed xatosi:", String(error?.message || error));
  }
}
await seedDataDir();

await buildReviewCss();

const httpApi = Object.freeze({ apiError, readJsonBody, sendJson });
const authService = Object.freeze({
  clearPinSessionCookieHeader,
  pinSessionCookieHeader,
  readPinFromRequest,
  reviewAccessPin,
  safeCompareSecret,
});
const storageService = createStorageService({
  BRANDS_FILE,
  MARKS_FILE,
  REASONS_FILE,
  deleteDatasetByDate,
  deleteReviewMarks,
  fileRevision,
  filterReviewMarks,
  loadBrandsConfig,
  readReviewMarks,
  readReviewReasons,
  reviewStateRevisions,
  saveBrandsConfig,
  validateBrandsConfig,
  writeReviewMarks,
  writeReviewReasons,
});
const salesService = createSalesService({
  collectContinue,
  isLocalHostHeader,
  openSalesLoginHelper,
  publicCollectState,
  startCollectJob,
  stopCollectJob,
});
const attendanceService = createAttendanceService({
  ATT_FILES,
  attendanceToCsv,
  exportAttendanceCsv,
  generateAttendanceMonth,
  loadAttendanceMonth,
  loadAttendanceStore,
  replaceEmployee,
  safeWriteJson,
  saveOverride,
  validateAttendanceData,
});
const telegramService = createTelegramService({
  cleanText,
  groupSuspiciousByAgent,
  maskChatId,
  readTelegramUsageStats,
  resolveTelegramChatIdForItems,
  sendSuspiciousSummaryToTelegram,
  sendSuspiciousToTelegramChat,
  summarizeTelegramUsageStats,
  telegramChats,
  telegramFileCacheChatId,
});
const photoService = Object.freeze({
  photoCacheKey,
  proxyPhoto,
  proxyPhotoThumbnail,
  readPhotoMetricsCache,
  readReviewMarks,
  readSuspiciousPhotos,
  rebuildSuspiciousPhotosFromMarks,
  writePhotoMetricsCache,
});
const authMiddleware = createAuthMiddleware({ accessHeaders, sendAccessDenied });
const apiRouter = createApiRouter({
  attendance: attendanceService,
  auth: authService,
  http: httpApi,
  photos: photoService,
  sales: salesService,
  storage: storageService,
  telegram: telegramService,
});

const server = createServer(async (req, res) => {
  try {
    const parsed = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
    if (await apiRouter.handlePublic({ req, res, parsed })) return;
    if (parsed.pathname === "/api/access/login") {
      if (req.method !== "POST") {
        sendJson(res, 405, { ok: false, error: "Method not allowed" });
        return;
      }
      const pin = reviewAccessPin();
      const given = await readPinFromRequest(req);
      if (!pin || !safeCompareSecret(given, pin)) {
        if (/application\/json/i.test(String(req.headers["content-type"] || ""))) {
          sendJson(res, 401, { ok: false, error: "PIN/parol noto'g'ri" });
          return;
        }
        res.writeHead(303, { Location: "/" });
        res.end();
        return;
      }
      if (/application\/json/i.test(String(req.headers["content-type"] || ""))) {
        sendJson(res, 200, { ok: true }, { "Set-Cookie": pinSessionCookieHeader() });
        return;
      }
      res.writeHead(303, {
        Location: "/lmj_date_photo_review.html",
        "Set-Cookie": pinSessionCookieHeader(),
      });
      res.end();
      return;
    }
    if (parsed.pathname === "/api/access/logout") {
      res.writeHead(303, {
        Location: "/",
        "Set-Cookie": clearPinSessionCookieHeader(),
      });
      res.end();
      return;
    }
    const access = authMiddleware.authorize(req, res, parsed);
    if (!access) return;
    if (await apiRouter.handleProtected({ req, res, parsed, access })) return;
    if (parsed.pathname === "/api/telegram/status") {
      const brandConfig = await loadBrandsConfig({ includeDisabled: true }).catch(() => ({ brands: [] }));
      const chats = [
        ...telegramChats(),
        ...(brandConfig.brands || []).map((brand) => ({
          id: cleanText(brand.telegramChatId),
          name: cleanText(brand.telegramChatName) || cleanText(brand.name) || cleanText(brand.id),
        })),
      ].filter((chat, index, list) => chat.id && list.findIndex((item) => item.id === chat.id) === index);
      sendJson(res, 200, {
        configured: Boolean(process.env.TELEGRAM_BOT_TOKEN && chats.length),
        chatId: maskChatId(process.env.TELEGRAM_CHAT_ID),
        chats: chats.map((chat) => ({ ...chat, maskedId: maskChatId(chat.id) })),
        fileCacheChatConfigured: Boolean(telegramFileCacheChatId()),
      }, access.headers);
      return;
    }
    if (parsed.pathname === "/api/admin/telegram-stats") {
      const stats = await readTelegramUsageStats();
      sendJson(res, 200, { ok: true, ...summarizeTelegramUsageStats(stats) }, access.headers);
      return;
    }
    if (parsed.pathname === "/api/brands") {
      if (req.method === "GET") {
        const config = await loadBrandsConfig({ includeDisabled: true });
        sendJson(res, 200, { ok: true, ...config, revision: await fileRevision(BRANDS_FILE) });
        return;
      }
      if (req.method === "POST") {
        const body = await readJsonBody(req, 1_000_000);
        const saved = await saveBrandsConfig(body);
        sendJson(res, 200, { ok: true, ...saved, revision: await fileRevision(BRANDS_FILE) });
        return;
      }
      sendJson(res, 405, { ok: false, error: "Method not allowed" });
      return;
    }
    if (parsed.pathname === "/api/reasons") {
      if (req.method === "GET") {
        sendJson(res, 200, { ok: true, ...(await readReviewReasons()), revision: await fileRevision(REASONS_FILE) }, access.headers);
        return;
      }
      if (req.method === "POST") {
        const body = await readJsonBody(req, 1_000_000);
        sendJson(res, 200, { ok: true, ...(await writeReviewReasons(body)), revision: await fileRevision(REASONS_FILE) }, access.headers);
        return;
      }
      sendJson(res, 405, { ok: false, error: "Method not allowed" });
      return;
    }
    if (parsed.pathname === "/api/sync") {
      const beforeRevisions = await reviewStateRevisions();
      let conflicts = {};
      if (req.method === "POST") {
        const body = await readJsonBody(req, 6_000_000);
        const base = body.baseRevisions && typeof body.baseRevisions === "object" ? body.baseRevisions : {};
        conflicts = {
          marks: Boolean(base.marks && base.marks !== beforeRevisions.marks),
          reasons: Boolean(base.reasons && base.reasons !== beforeRevisions.reasons),
          brands: Boolean(base.brands && base.brands !== beforeRevisions.brands),
        };
        if (body.marks) await writeReviewMarks(body.marks);
        if (body.reasons) await writeReviewReasons(body.reasons);
      } else if (req.method !== "GET") {
        sendJson(res, 405, { ok: false, error: "Method not allowed" });
        return;
      }
      const brands = await loadBrandsConfig({ includeDisabled: true });
      const reasons = await readReviewReasons();
      const light = parsed.searchParams.get("light") === "1";
      const marks = light ? undefined : await readReviewMarks();
      const revisions = await reviewStateRevisions();
      sendJson(res, 200, {
        ok: true,
        serverTime: new Date().toISOString(),
        marks,
        marksLight: light,
        reasons,
        brands,
        revisions,
        conflicts,
      }, access.headers);
      return;
    }
    if (parsed.pathname === "/api/brands/validate") {
      if (req.method !== "POST") {
        sendJson(res, 405, { ok: false, error: "Method not allowed" });
        return;
      }
      const body = await readJsonBody(req, 1_000_000);
      const validation = validateBrandsConfig(body);
      sendJson(res, validation.ok ? 200 : 400, { ok: validation.ok, ...validation });
      return;
    }
    if (parsed.pathname.startsWith("/api/brands/")) {
      const id = decodeURIComponent(parsed.pathname.replace(/^\/api\/brands\//, "")).trim();
      const config = await loadBrandsConfig({ includeDisabled: true });
      const index = config.brands.findIndex((brand) => brand.id === id);
      if (index < 0) throw apiError(`Brend topilmadi: ${id}`, 404);
      if (req.method === "PUT") {
        const body = await readJsonBody(req, 1_000_000);
        config.brands[index] = { ...config.brands[index], ...body, id };
        const saved = await saveBrandsConfig(config);
        sendJson(res, 200, { ok: true, ...saved, revision: await fileRevision(BRANDS_FILE) });
        return;
      }
      if (req.method === "DELETE") {
        config.brands = config.brands.filter((brand) => brand.id !== id);
        const saved = await saveBrandsConfig(config);
        sendJson(res, 200, { ok: true, ...saved, revision: await fileRevision(BRANDS_FILE) });
        return;
      }
      sendJson(res, 405, { ok: false, error: "Method not allowed" });
      return;
    }
    if (parsed.pathname === "/api/attendance/config") {
      const store = await loadAttendanceStore();
      sendJson(res, 200, {
        ok: true,
        employees: store.employees,
        routes: store.routes,
        assignments: store.assignments,
        settings: store.settings,
        validation: validateAttendanceData(store),
      });
      return;
    }
    if (parsed.pathname === "/api/attendance/month") {
      const month = parsed.searchParams.get("month");
      const brandId = parsed.searchParams.get("brandId") || "";
      const data = await loadAttendanceMonth({ month, brandId });
      sendJson(res, 200, { ok: true, ...data });
      return;
    }
    if (parsed.pathname === "/api/attendance/generate") {
      if (req.method !== "POST") {
        sendJson(res, 405, { ok: false, error: "Method not allowed" });
        return;
      }
      const body = await readJsonBody(req, 1_000_000);
      const data = await generateAttendanceMonth({ month: body.month, brandId: body.brandId || "" });
      sendJson(res, 200, { ok: true, ...data });
      return;
    }
    if (parsed.pathname === "/api/attendance/override") {
      if (req.method !== "POST") {
        sendJson(res, 405, { ok: false, error: "Method not allowed" });
        return;
      }
      const body = await readJsonBody(req, 1_000_000);
      const override = await saveOverride(body);
      const month = String(body.date || "").slice(0, 7);
      const data = await generateAttendanceMonth({ month, brandId: body.brandId || "" });
      sendJson(res, 200, {
        ok: true,
        override,
        changedCell: {
          date: override.date,
          agentCode: override.agentCode,
          employeeId: override.employeeId,
          manualValue: override.manualValue,
        },
        summaryTotals: data.summaryTotals,
        month: data,
      });
      return;
    }
    if (parsed.pathname === "/api/attendance/employees") {
      const store = await loadAttendanceStore();
      if (req.method === "GET") {
        sendJson(res, 200, { ok: true, employees: store.employees });
        return;
      }
      if (req.method === "POST") {
        const body = await readJsonBody(req, 1_000_000);
        const employees = Array.isArray(body.employees) ? body.employees : [...store.employees, body];
        const validation = validateAttendanceData({ ...store, employees });
        if (!validation.ok) throw apiError(validation.errors.join("; "), 400);
        await safeWriteJson(ATT_FILES.employees, { employees }, "employees");
        sendJson(res, 200, { ok: true, employees, validation });
        return;
      }
      sendJson(res, 405, { ok: false, error: "Method not allowed" });
      return;
    }
    if (parsed.pathname === "/api/attendance/routes") {
      const store = await loadAttendanceStore();
      if (req.method === "GET") {
        sendJson(res, 200, { ok: true, routes: store.routes });
        return;
      }
      if (req.method === "POST") {
        const body = await readJsonBody(req, 1_000_000);
        const routes = Array.isArray(body.routes) ? body.routes : [...store.routes, body];
        const validation = validateAttendanceData({ ...store, routes });
        if (!validation.ok) throw apiError(validation.errors.join("; "), 400);
        await safeWriteJson(ATT_FILES.routes, { routes }, "routes");
        sendJson(res, 200, { ok: true, routes, validation });
        return;
      }
      sendJson(res, 405, { ok: false, error: "Method not allowed" });
      return;
    }
    if (parsed.pathname === "/api/attendance/assignments") {
      const store = await loadAttendanceStore();
      if (req.method === "GET") {
        sendJson(res, 200, { ok: true, assignments: store.assignments });
        return;
      }
      if (req.method === "POST") {
        const body = await readJsonBody(req, 1_000_000);
        const assignments = Array.isArray(body.assignments) ? body.assignments : [...store.assignments, body];
        const validation = validateAttendanceData({ ...store, assignments });
        if (!validation.ok) throw apiError(validation.errors.join("; "), 400);
        await safeWriteJson(ATT_FILES.assignments, { assignments }, "assignments");
        sendJson(res, 200, { ok: true, assignments, validation });
        return;
      }
      sendJson(res, 405, { ok: false, error: "Method not allowed" });
      return;
    }
    if (parsed.pathname === "/api/attendance/assignments/replace-employee") {
      if (req.method !== "POST") {
        sendJson(res, 405, { ok: false, error: "Method not allowed" });
        return;
      }
      const body = await readJsonBody(req, 1_000_000);
      const result = await replaceEmployee(body);
      sendJson(res, 200, { ok: true, ...result });
      return;
    }
    if (parsed.pathname === "/api/attendance/export") {
      const month = parsed.searchParams.get("month");
      const brandId = parsed.searchParams.get("brandId") || "";
      const result = await exportAttendanceCsv({ month, brandId });
      const csv = attendanceToCsv(result.data);
      res.writeHead(200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="attendance-${result.data.month}${brandId ? `-${brandId}` : ""}.csv"`,
        "Cache-Control": "no-store",
      });
      res.end(`\uFEFF${csv}\n`);
      return;
    }
    if (parsed.pathname === "/api/telegram/preview-suspicious") {
      if (req.method !== "POST") {
        sendJson(res, 405, { ok: false, error: "Method not allowed" });
        return;
      }
      const body = await readJsonBody(req);
      const items = Array.isArray(body.items) ? body.items : [];
      if (!items.length) throw apiError("Tekshirish uchun foto yo'q", 400);
      const groups = groupSuspiciousByAgent(items);
      const chatId = await resolveTelegramChatIdForItems(items, body.chatId);
      sendJson(res, 200, {
        ok: true,
        mode: cleanText(body.mode || process.env.TELEGRAM_SEND_MODE || "summary").toLowerCase(),
        chatId: maskChatId(chatId),
        photos: items.length,
        agents: groups.length,
        groups: groups.map((group) => ({
          date: group.date,
          code: group.code,
          agent: group.agent,
          photos: group.items.length,
        })),
      });
      return;
    }
    if (parsed.pathname === "/api/telegram/preview-suspicious") {
      if (req.method !== "POST") {
        sendJson(res, 405, { ok: false, error: "Method not allowed" });
        return;
      }
      const body = await readJsonBody(req, 2_000_000);
      const preview = await telegramSuspiciousPreview(body.items, body.chatId);
      sendJson(res, 200, { ok: true, preview }, access.headers);
      return;
    }
    if (parsed.pathname === "/api/telegram/send-suspicious") {
      if (req.method !== "POST") {
        sendJson(res, 405, { ok: false, error: "Method not allowed" });
        return;
      }
      const body = await readJsonBody(req);
      const mode = cleanText(body.mode || process.env.TELEGRAM_SEND_MODE || "summary").toLowerCase();
      const allowDirectMedia = process.env.TELEGRAM_ALLOW_DIRECT_MEDIA === "1";
      const result = mode === "media" && allowDirectMedia
        ? await sendSuspiciousToTelegramChat(body.items, body.chatId)
        : await sendSuspiciousSummaryToTelegram(body.items, body.chatId);
      sendJson(res, result.failed.length ? 207 : 200, { ok: result.failed.length === 0, ...result });
      return;
    }
    if (parsed.pathname === "/api/collect/status") {
      sendJson(res, 200, { ok: true, collect: publicCollectState() });
      return;
    }
    if (parsed.pathname === "/api/collect/start") {
      if (req.method !== "POST") {
        sendJson(res, 405, { ok: false, error: "Method not allowed" });
        return;
      }
      const body = await readJsonBody(req);
      await startCollectJob({ date: body.date, brand: body.brand, browserHint: isLocalHostHeader(req) ? body.browserHint : "" });
      sendJson(res, 200, { ok: true, collect: publicCollectState() });
      return;
    }
    if (parsed.pathname === "/api/collect/continue") {
      if (req.method !== "POST") {
        sendJson(res, 405, { ok: false, error: "Method not allowed" });
        return;
      }
      collectContinue();
      sendJson(res, 200, { ok: true, collect: publicCollectState() });
      return;
    }
    if (parsed.pathname === "/api/collect/open-login") {
      if (req.method !== "POST") {
        sendJson(res, 405, { ok: false, error: "Method not allowed" });
        return;
      }
      openSalesLoginHelper();
      sendJson(res, 200, { ok: true, collect: publicCollectState() });
      return;
    }
    if (parsed.pathname === "/api/collect/stop") {
      if (req.method !== "POST") {
        sendJson(res, 405, { ok: false, error: "Method not allowed" });
        return;
      }
      stopCollectJob();
      sendJson(res, 200, { ok: true, collect: publicCollectState() });
      return;
    }
    if (parsed.pathname === "/api/photo") {
      const photoUrl = parsed.searchParams.get("url");
      const photoVariant = parsed.searchParams.get("view") === "thumb" ? "thumb" : "full";
      const photoEtag = `W/"photo-${photoVariant}-${photoCacheKey(photoUrl)}"`;
      if (req.headers["if-none-match"] === photoEtag) {
        res.writeHead(304, {
          "Cache-Control": "public, max-age=604800, immutable",
          ETag: photoEtag,
          ...access.headers,
        });
        res.end();
        return;
      }
      const photo = photoVariant === "thumb"
        ? await proxyPhotoThumbnail(photoUrl)
        : await proxyPhoto(photoUrl);
      res.writeHead(200, {
        "Content-Type": photo.contentType,
        "Cache-Control": "public, max-age=604800, immutable",
        ETag: photoEtag,
        "X-Photo-Cache": photo.cached ? "hit" : "miss",
        "X-Photo-Variant": photoVariant,
        ...access.headers,
      });
      res.end(photo.data);
      return;
    }
    if (parsed.pathname === "/api/marks") {
      if (req.method === "GET") {
        const brands = await loadBrandsConfig({ includeDisabled: true }).catch(() => ({ brands: [] }));
        const marks = await readReviewMarks();
        const filtered = filterReviewMarks(marks, {
          brand: parsed.searchParams.get("brand") || "",
          date: parsed.searchParams.get("date") || "",
          verdict: parsed.searchParams.get("verdict") || "",
        }, brands);
        sendJson(res, 200, { ok: true, marks: filtered, total: Object.keys(filtered).length, revision: await fileRevision(MARKS_FILE) }, access.headers);
        return;
      }
      if (req.method === "POST") {
        const body = await readJsonBody(req, 5_000_000);
        const beforeRevision = await fileRevision(MARKS_FILE);
        const merged = await writeReviewMarks(body.marks);
        const compact = parsed.searchParams.get("compact") === "1";
        const responseMarks = compact
          ? Object.fromEntries(Object.keys(body.marks || {}).filter((key) => merged[key]).map((key) => [key, merged[key]]))
          : merged;
        sendJson(res, 200, {
          ok: true,
          marks: responseMarks,
          revision: await fileRevision(MARKS_FILE),
          conflict: Boolean(body.baseRevision && body.baseRevision !== beforeRevision),
        }, access.headers);
        return;
      }
      if (req.method === "DELETE") {
        const result = await deleteReviewMarks({ date: parsed.searchParams.get("date") || "" });
        sendJson(res, 200, { ok: true, deleted: result.deleted, revision: await fileRevision(MARKS_FILE) }, access.headers);
        return;
      }
      sendJson(res, 405, { ok: false, error: "Method not allowed" });
      return;
    }
    if (parsed.pathname === "/api/suspicious-photos") {
      if (req.method === "GET") {
        const rebuild = parsed.searchParams.get("rebuild") === "1";
        const data = rebuild
          ? await rebuildSuspiciousPhotosFromMarks(await readReviewMarks())
          : await readSuspiciousPhotos();
        sendJson(res, 200, { ok: true, total: data.items.length, updatedAt: data.updatedAt, items: data.items }, access.headers);
        return;
      }
      if (req.method === "POST") {
        const data = await rebuildSuspiciousPhotosFromMarks(await readReviewMarks());
        sendJson(res, 200, { ok: true, total: data.items.length, updatedAt: data.updatedAt, items: data.items }, access.headers);
        return;
      }
      sendJson(res, 405, { ok: false, error: "Method not allowed" });
      return;
    }
    if (parsed.pathname === "/api/photo-metrics") {
      if (req.method === "GET") {
        const data = await readPhotoMetricsCache();
        sendJson(res, 200, { ok: true, total: data.total, updatedAt: data.updatedAt, items: data.items }, access.headers);
        return;
      }
      if (req.method === "POST") {
        const body = await readJsonBody(req, 5_000_000);
        const data = await writePhotoMetricsCache(body);
        sendJson(res, 200, { ok: true, total: data.total, updatedAt: data.updatedAt }, access.headers);
        return;
      }
      sendJson(res, 405, { ok: false, error: "Method not allowed" });
      return;
    }
    if (parsed.pathname === "/api/datasets/delete") {
      if (req.method !== "POST" && req.method !== "DELETE") {
        sendJson(res, 405, { ok: false, error: "Method not allowed" });
        return;
      }
      const body = req.method === "DELETE"
        ? { date: parsed.searchParams.get("date") }
        : await readJsonBody(req);
      const result = await deleteDatasetByDate(body.date);
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    const urlPath = req.url === "/" ? "/lmj_date_photo_review.html" : req.url;
    const filePath = safePath(urlPath);
    if (!filePath) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    const info = await stat(filePath);
    const etag = weakEtag(info);
    if (req.headers["if-none-match"] === etag) {
      res.writeHead(304, {
        "Cache-Control": cacheControlForFile(filePath),
        ETag: etag,
        ...access.headers,
      });
      res.end();
      return;
    }
    const data = await readStaticFileCached(filePath);
    const ext = extname(filePath).toLowerCase();
    const acceptsGzip = /\bgzip\b/i.test(String(req.headers["accept-encoding"] || ""));
    const shouldGzip = acceptsGzip && data.length > 1024 && isCompressibleFile(filePath);
    const body = shouldGzip ? gzipStaticFile(filePath, data, info) : data;
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": cacheControlForFile(filePath),
      ETag: etag,
      ...(shouldGzip ? { "Content-Encoding": "gzip", Vary: "Accept-Encoding" } : {}),
      ...access.headers,
    });
    res.end(body);
  } catch (error) {
    if (handleRequestError(req, res, error, sendJson)) return;
    res.writeHead(404);
    res.end("Not found");
  }
});

server.on("error", (error) => {
  if (error?.code === "EADDRINUSE") {
    console.error(`Port band: ${HOST}:${PORT} boshqa dastur tomonidan ishlatyapti.`);
    console.error("Eski serverni yopib qayta urinib ko'ring yoki boshqa PORT bering:");
    console.error("  $env:PORT=8766; npm run review");
    process.exit(1);
  }
  throw error;
});

server.listen(PORT, HOST, async () => {
  console.log(`LMJ review server: ${REVIEW_URL}`);
  console.log(`Papka: ${OUTPUTS}`);
  try {
    const repaired = await repairTelegramSessionsFromUsageStats();
    if (repaired.repaired) console.log(`Telegram eski link sessionlari tiklandi: ${repaired.repaired}`);
  } catch (error) {
    console.warn("Telegram eski link sessionlarini tiklash xatosi:", error?.message || error);
  }
  startPhotoCacheCleanup();
  startMaintenanceSchedule();
  startTelegramBotPolling();
  openBrowser(REVIEW_URL);
});

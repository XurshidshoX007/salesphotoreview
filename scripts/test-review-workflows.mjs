import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const baseUrl = String(process.env.REVIEW_TEST_URL || "http://127.0.0.1:8876").replace(/\/$/, "");

async function localEnv() {
  const values = {};
  for (const name of [".env.local", ".env"]) {
    const file = join(root, name);
    if (!existsSync(file)) continue;
    const source = await readFile(file, "utf8");
    for (const line of source.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!match || values[match[1]]) continue;
      values[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
  return values;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const env = await localEnv();
const access = env.REVIEW_ACCESS_TOKEN || env.APP_ACCESS_TOKEN || "";

function apiUrl(path) {
  const url = new URL(path, `${baseUrl}/`);
  if (access) url.searchParams.set("access", access);
  return url;
}

async function get(path) {
  const response = await fetch(apiUrl(path));
  const data = await response.json().catch(() => ({}));
  assert(response.ok && data.ok !== false, `${path} xato: HTTP ${response.status} ${data.error || ""}`);
  return data;
}

async function post(path, body) {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  assert(response.ok && data.ok !== false, `${path} xato: HTTP ${response.status} ${data.error || ""}`);
  return data;
}

const [sync, brands, reasons, telegram, collect, attendance, suspicious] = await Promise.all([
  get("/api/sync?light=1"),
  get("/api/brands"),
  get("/api/reasons"),
  get("/api/telegram/status"),
  get("/api/collect/status"),
  get("/api/attendance/config"),
  get("/api/suspicious-photos"),
]);

assert(sync.revisions?.marks && sync.revisions?.brands && sync.revisions?.reasons, "Sync revisionlar yetarli emas");
assert(Array.isArray(brands.brands), "Brend ro'yxati array emas");
assert(Array.isArray(reasons.customReasons), "Custom sabablar ro'yxati array emas");
assert(reasons.reasonOverrides && typeof reasons.reasonOverrides === "object", "Sabab override ma'lumoti yo'q");
assert(Array.isArray(telegram.chats) && typeof telegram.configured === "boolean", "Telegram status topilmadi");
assert(collect.collect && typeof collect.collect === "object", "Collect status topilmadi");
assert(Array.isArray(attendance.employees) && Array.isArray(attendance.routes), "Attendance config topilmadi");
assert(Array.isArray(suspicious.items), "Shubhali foto bazasi array emas");

let previewText = "foto yo'q";
if (suspicious.items.length) {
  const sample = suspicious.items.slice(0, 40);
  const preview = await post("/api/telegram/preview-suspicious", { items: sample });
  assert(preview.photos === sample.length, "Telegram preview foto sonini yo'qotdi");
  assert(preview.agents === preview.groups.length, "Telegram preview agent guruhlari mos emas");
  assert(preview.groups.every((group) => group.code && group.photos > 0), "Telegram preview guruhida ma'lumot yetishmaydi");
  const groupedPhotos = preview.groups.reduce((sum, group) => sum + group.photos, 0);
  assert(groupedPhotos === sample.length, `Telegram grouping foto yo'qotdi: ${groupedPhotos}/${sample.length}`);
  previewText = `${preview.agents} agent / ${preview.photos} foto`;
}

console.log(`Review workflows OK | ${brands.brands.length} brend | ${reasons.customReasons.length} custom sabab | Telegram preview ${previewText} | collect ${collect.collect.status}`);

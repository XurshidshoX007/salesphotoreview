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
    const text = await readFile(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!match || values[match[1]]) continue;
      values[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
  return values;
}

function findPhotoUrl(value) {
  const stack = [value];
  while (stack.length) {
    const current = stack.pop();
    if (typeof current === "string" && /^https?:\/\//i.test(current)) return current;
    if (Array.isArray(current)) stack.push(...current);
    else if (current && typeof current === "object") stack.push(...Object.values(current));
  }
  return "";
}

async function samplePhotoUrl() {
  const manifest = JSON.parse(await readFile(join(root, "outputs", "lmj_review_datasets.json"), "utf8"));
  for (const item of [...(manifest.datasets || [])].reverse()) {
    try {
      const dataset = JSON.parse(await readFile(join(root, "outputs", item.file), "utf8"));
      const url = findPhotoUrl(dataset);
      if (url) return url;
    } catch {
      // Skip missing or temporarily incomplete datasets.
    }
  }
  throw new Error("Test uchun foto URL topilmadi");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const env = await localEnv();
const access = env.REVIEW_ACCESS_TOKEN || env.APP_ACCESS_TOKEN || "";
const auth = access ? `&access=${encodeURIComponent(access)}` : "";

const syncResponse = await fetch(`${baseUrl}/api/sync?light=1${auth}`);
const sync = await syncResponse.json();
assert(syncResponse.ok && sync.ok, `Sync API xato: HTTP ${syncResponse.status}`);
assert(sync.marksLight === true, "Light sync marksLight=true qaytarmadi");
assert(sync.revisions?.marks && sync.revisions?.reasons && sync.revisions?.brands, "Sync revisionlar to'liq emas");

const photoUrl = await samplePhotoUrl();
const results = {};
for (const view of ["thumb", "full"]) {
  const response = await fetch(`${baseUrl}/api/photo?view=${view}&url=${encodeURIComponent(photoUrl)}${auth}`);
  const data = Buffer.from(await response.arrayBuffer());
  assert(response.ok, `${view} foto xato: HTTP ${response.status}`);
  assert(response.headers.get("x-photo-variant") === view, `${view} variant header noto'g'ri`);
  assert(/^image\//i.test(response.headers.get("content-type") || ""), `${view} image qaytarmadi`);
  results[view] = { bytes: data.length, type: response.headers.get("content-type") };
}
assert(results.thumb.type === "image/webp", "Thumbnail WebP emas");
assert(results.thumb.bytes < results.full.bytes, `Thumbnail kichik emas: ${results.thumb.bytes} >= ${results.full.bytes}`);

console.log(`Review API OK | thumb ${(results.thumb.bytes / 1024).toFixed(1)} KB | full ${(results.full.bytes / 1024).toFixed(1)} KB`);

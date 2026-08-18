import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { localEnv, reviewAuth } from "./lib/review-test-auth.mjs";
import { ensureReviewTestServer } from "./lib/review-test-server.mjs";

const root = process.cwd();
const baseUrl = String(process.env.REVIEW_TEST_URL || "http://127.0.0.1:8876").replace(/\/$/, "");
await ensureReviewTestServer(baseUrl, root);

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
const auth = await reviewAuth(baseUrl, env);

const syncResponse = await fetch(`${baseUrl}/api/sync?light=1`, { headers: auth.headers });
const sync = await syncResponse.json();
assert(syncResponse.ok && sync.ok, `Sync API xato: HTTP ${syncResponse.status}`);
assert(sync.marksLight === true, "Light sync marksLight=true qaytarmadi");
assert(sync.revisions?.marks && sync.revisions?.reasons && sync.revisions?.brands, "Sync revisionlar to'liq emas");

const results = {};
if (!process.env.CI) {
  const photoUrl = await samplePhotoUrl();
  for (const view of ["thumb", "full"]) {
    const response = await fetch(`${baseUrl}/api/photo?view=${view}&url=${encodeURIComponent(photoUrl)}`, { headers: auth.headers });
    const data = Buffer.from(await response.arrayBuffer());
    assert(response.ok, `${view} foto xato: HTTP ${response.status}`);
    assert(response.headers.get("x-photo-variant") === view, `${view} variant header noto'g'ri`);
    assert(/^image\//i.test(response.headers.get("content-type") || ""), `${view} image qaytarmadi`);
    results[view] = { bytes: data.length, type: response.headers.get("content-type") };
  }
  assert(results.thumb.type === "image/webp", "Thumbnail WebP emas");
  assert(results.thumb.bytes < results.full.bytes, `Thumbnail kichik emas: ${results.thumb.bytes} >= ${results.full.bytes}`);
}

console.log(process.env.CI
  ? "Review API OK | tashqi foto testi CI'da xavfsiz skip qilindi"
  : `Review API OK | thumb ${(results.thumb.bytes / 1024).toFixed(1)} KB | full ${(results.full.bytes / 1024).toFixed(1)} KB`);

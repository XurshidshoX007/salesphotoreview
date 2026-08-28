import assert from "node:assert/strict";
import { localEnv, reviewAuth } from "./lib/review-test-auth.mjs";
import { ensureReviewTestServer } from "./lib/review-test-server.mjs";

const root = process.cwd();
const baseUrl = String(process.env.REVIEW_PERF_TEST_URL || "http://127.0.0.1:8898").replace(/\/$/, "");
const dataBaseUrl = String(process.env.REVIEW_PERF_DATA_URL || baseUrl).replace(/\/$/, "");
const server = await ensureReviewTestServer(baseUrl, root);

function collectPhotoUrls(value, output = []) {
  if (typeof value === "string" && /^https?:\/\//i.test(value)) output.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectPhotoUrls(item, output));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collectPhotoUrls(item, output));
  return output;
}

async function timedPhoto(url, headers) {
  const started = performance.now();
  const response = await fetch(`${baseUrl}/api/photo?view=thumb&url=${encodeURIComponent(url)}`, {
    headers,
    signal: AbortSignal.timeout(8_000),
  });
  await response.arrayBuffer();
  return {
    ok: response.ok,
    status: response.status,
    cache: response.headers.get("x-photo-cache") || "",
    duration: performance.now() - started,
  };
}

try {
  const env = await localEnv(root);
  const auth = await reviewAuth(baseUrl, env);
  const dataAuth = dataBaseUrl === baseUrl ? auth : await reviewAuth(dataBaseUrl, env);
  const manifestResponse = await fetch(`${dataBaseUrl}/lmj_review_datasets.json`, { headers: dataAuth.headers });
  assert(manifestResponse.ok, `Manifest ochilmadi: HTTP ${manifestResponse.status}`);
  const manifest = await manifestResponse.json();
  const candidates = [];
  for (const item of [...(manifest.datasets || [])].reverse().slice(0, 6)) {
    const response = await fetch(`${dataBaseUrl}/${item.file}`, { headers: dataAuth.headers });
    if (!response.ok) continue;
    const dataset = await response.json();
    candidates.push(...collectPhotoUrls(dataset));
    if (candidates.length >= 30) break;
  }

  let result = null;
  for (const url of [...new Set(candidates)].slice(0, 30)) {
    try {
      const first = await timedPhoto(url, auth.headers);
      if (!first.ok) continue;
      const second = await timedPhoto(url, auth.headers);
      if (!second.ok) continue;
      result = { first, second };
      break;
    } catch {
      // Eski yoki vaqtincha ochilmayotgan Sales URL'ini o'tkazib yuboramiz.
    }
  }

  if (!result) {
    console.log("Photo cache SKIP | joriy manifestda ishlaydigan tashqi foto topilmadi");
  } else {
    assert.equal(result.second.cache, "hit", "Takroriy rasm so'rovi server cache hit bo'lmadi");
    assert(result.second.duration < 500, `Cache hit sekin: ${result.second.duration.toFixed(0)} ms`);
    console.log(`Photo cache OK | first ${result.first.duration.toFixed(0)} ms (${result.first.cache}) | repeat ${result.second.duration.toFixed(0)} ms (${result.second.cache})`);
  }
} finally {
  server?.kill();
}

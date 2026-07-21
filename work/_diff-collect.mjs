// Aniqlik testi: HTTP yig'uvchini vaqtinchalik faylga ishga tushirib,
// mavjud brauzer natijasi bilan solishtiradi.
// Foydalanish: node work/_diff-collect.mjs <YYYY-MM-DD> <brandId> <browserRawPath>
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { collectLmjForSalesDate } from "./lmj_sales_browser_collect.mjs";
import { loadBrandsConfig, findBrand, publicBrand } from "../scripts/brand-config.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://lalaku.lalakusales.com";

const [, , date, brandId, browserRawArg] = process.argv;
if (!date || !brandId || !browserRawArg) {
  console.error("Foydalanish: node work/_diff-collect.mjs <date> <brandId> <browserRaw>");
  process.exit(1);
}

for (const name of [".env.local", ".env"]) {
  const file = join(ROOT, name);
  if (!existsSync(file)) continue;
  for (const line of (await readFile(file, "utf8")).split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

async function login() {
  const res = await fetch(`${BASE}/api/v1.1/web/Tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "Accept-Language": "uz" },
    body: JSON.stringify({
      login: process.env.SALES_USERNAME || process.env.SALES_LOGIN,
      password: process.env.SALES_PASSWORD || process.env.SALES_PASS,
      device_id: randomUUID(),
    }),
  });
  const j = await res.json();
  if (!res.ok || !j?.token) throw new Error("login fail");
  return j.token;
}

function makeNodeTab(token) {
  return {
    nodeHttp: async (path, payload, timeoutMs) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let res, text = "";
      try {
        res = await fetch(`${BASE}${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json", Accept: "application/json",
            "Accept-Timezone": "Asia/Tashkent", "Accept-Language": "uz",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload), signal: controller.signal,
        });
        text = await res.text();
      } finally { clearTimeout(timer); }
      let json = null; try { json = text ? JSON.parse(text) : null; } catch {}
      if (!res.ok) throw new Error(json?.message || text || `HTTP ${res.status}`);
      return json;
    },
  };
}

const config = await loadBrandsConfig();
const brand = publicBrand(findBrand(config, brandId));
const token = await login();
const outPath = join(tmpdir(), `http_collect_${brandId}_${date}.json`);

console.log(`HTTP yig'ish: ${brandId} / ${date} ...`);
const t0 = Date.now();
const http = await collectLmjForSalesDate(makeNodeTab(token), { targetDate: date, outPath, applyDate: false, brand });
console.log(`HTTP tugadi (${((Date.now() - t0) / 1000).toFixed(1)}s)\n`);

const browser = JSON.parse(await readFile(resolve(ROOT, browserRawArg), "utf8"));

// Taqqoslash
function agentMap(data) {
  const m = new Map();
  for (const a of data.agents || []) m.set(a.code, a);
  return m;
}
const hm = agentMap(http), bm = agentMap(browser);
const allCodes = [...new Set([...hm.keys(), ...bm.keys()])].sort();

let urlMismatch = 0, missingInHttp = 0, missingInBrowser = 0, exactUrlMatch = 0, photoCountDiff = 0;
const samples = [];
for (const code of allCodes) {
  const h = hm.get(code), b = bm.get(code);
  if (!h) { missingInHttp++; continue; }
  if (!b) { missingInBrowser++; continue; }
  const hu = new Set(h.urls || []), bu = new Set(b.urls || []);
  if (hu.size === bu.size && [...hu].every((u) => bu.has(u))) exactUrlMatch++;
  else {
    urlMismatch++;
    if (samples.length < 8) samples.push(`${code}: http=${hu.size} browser=${bu.size} (expected=${b.expectedPhotos})`);
  }
  if ((h.actualUrls || 0) !== (b.actualUrls || 0)) photoCountDiff++;
}

console.log("=== TAQQOSLASH ===");
console.log(`Agentlar: http=${http.totalAgents} browser=${browser.totalAgents}`);
console.log(`Fotoli:   http=${http.totalAgentsWithPhotos} browser=${browser.totalAgentsWithPhotos}`);
const sumUrls = (d) => (d.agents || []).reduce((s, a) => s + (a.actualUrls || 0), 0);
console.log(`Jami URL: http=${sumUrls(http)} browser=${sumUrls(browser)}`);
console.log(`Stats http:    ${JSON.stringify(http.stats)}`);
console.log(`Stats browser: ${JSON.stringify(browser.stats)}`);
console.log(`\nURL to'liq mos agentlar: ${exactUrlMatch}/${allCodes.length}`);
console.log(`URL farqli: ${urlMismatch} | faqat http'da: ${missingInBrowser} | faqat browser'da: ${missingInHttp}`);
if (samples.length) { console.log("Farq namunalari:"); samples.forEach((s) => console.log("  " + s)); }

const verdict = urlMismatch === 0 && missingInHttp === 0 && missingInBrowser === 0;
console.log(`\nXULOSA: ${verdict ? "✅ AYNAN MOS — HTTP yig'uvchi brauzer bilan bir xil" : "⚠️ farqlar bor (yuqoriga qarang)"}`);

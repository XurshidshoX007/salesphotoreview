// Brauzersiz (HTTP) ma'lumot yig'uvchi — Chrome/Playwright ishlatmaydi.
// Login: POST /api/v1.1/web/Tokens -> Bearer token.
// Yig'ish: mavjud collectLmjForSalesDate (API yo'li) o'zgarishsiz ishlatiladi,
// faqat transport Node fetch. Shu bois natija brauzer versiyasi bilan bir xil.
//
// Foydalanish:  node work/run_collect_http.mjs [YYYY-MM-DD] [brend]
// Env:          SALES_USERNAME, SALES_PASSWORD (.env.local); ixtiyoriy BRAND_PREFIX
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { collectLmjForSalesDate, updateDatasetManifest } from "./lmj_sales_browser_collect.mjs";
import { loadBrandsConfig, findBrand, publicBrand } from "../scripts/brand-config.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Railway'da yig'ilgan ma'lumot Volume'ga yoziladi; lokalda ROOT bilan bir xil.
const DATA_ROOT = process.env.DATA_DIR ? resolve(process.env.DATA_DIR) : ROOT;
const BASE = (process.env.SALES_BASE_URL || "https://lalaku.lalakusales.com").replace(/\/$/, "");
const LOGIN_PATH = process.env.SALES_LOGIN_PATH || "/api/v1.1/web/Tokens";

function yesterdayIso() {
  const d = new Date(Date.now() - 86400000);
  return d.toISOString().slice(0, 10);
}

async function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const file = join(ROOT, name);
    if (!existsSync(file)) continue;
    for (const line of (await readFile(file, "utf8")).split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

async function resolveBrand(arg) {
  try {
    const config = await loadBrandsConfig();
    if (arg) {
      const found = findBrand(config, arg);
      if (found) return publicBrand(found);
    }
    const prefix = process.env.BRAND_PREFIX;
    if (prefix) {
      const found = findBrand(config, prefix);
      if (found) return publicBrand(found);
    }
  } catch {}
  return null; // collectLmjForSalesDate o'zi fallback brand yasaydi
}

async function login() {
  const login = process.env.SALES_USERNAME || process.env.SALES_LOGIN || "";
  const password = process.env.SALES_PASSWORD || process.env.SALES_PASS || "";
  if (!login || !password) {
    throw new Error(".env.local da SALES_USERNAME va SALES_PASSWORD bo'lishi shart");
  }
  const res = await fetch(`${BASE}${LOGIN_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Language": "uz",
      "User-Agent": process.env.SALES_USER_AGENT
        || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    },
    body: JSON.stringify({ login, password, device_id: process.env.SALES_DEVICE_ID || randomUUID() }),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  if (!res.ok || !json?.token) {
    const reason = json?.errors ? JSON.stringify(json.errors) : (json?.title || `HTTP ${res.status}`);
    throw new Error(`Login ishlamadi: ${reason}`);
  }
  return json.token;
}

// Mavjud kod kutgan "tab" interfeysi — faqat nodeHttp transport.
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
            "Content-Type": "application/json",
            Accept: "application/json",
            "Accept-Timezone": "Asia/Tashkent",
            "Accept-Language": "uz",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        text = await res.text();
      } finally {
        clearTimeout(timer);
      }
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch {}
      if (!res.ok) throw new Error(json?.message || json?.Messages?.[0] || text || `HTTP ${res.status}`);
      return json;
    },
  };
}

async function main() {
  await loadEnv();
  const targetDate = process.argv[2] && /^\d{4}-\d{2}-\d{2}$/.test(process.argv[2]) ? process.argv[2] : yesterdayIso();
  const brandArg = process.argv.slice(process.argv[2] && /^\d{4}-\d{2}-\d{2}$/.test(process.argv[2]) ? 3 : 2).join(" ").trim();
  const brand = await resolveBrand(brandArg);
  const filePrefix = brand?.filePrefix || (String(process.env.BRAND_PREFIX || "LMJ").toUpperCase() === "JY" ? "jy" : "lmj");
  const outPath = join(DATA_ROOT, "outputs", `${filePrefix}_browser_collect_${targetDate}_raw.json`);

  console.log(`\n=== HTTP yig'ish (brauzersiz) ===`);
  console.log(`Sana: ${targetDate} | Brend: ${brand?.name || process.env.BRAND_PREFIX || "avto"}`);
  console.log("Login qilinmoqda...");
  const token = await login();
  console.log("Login OK, token olindi. Yig'ish boshlandi...\n");

  const tab = makeNodeTab(token);
  const t0 = Date.now();
  let lastLog = 0;
  const result = await collectLmjForSalesDate(tab, {
    targetDate,
    outPath,
    applyDate: false, // sana date_range orqali beriladi, DOM kalendariga tegilmaydi
    brand: brand || undefined,
    brandPrefix: brand ? undefined : process.env.BRAND_PREFIX,
    progress: (p) => {
      if (p.type === "perf") { console.log(`  [perf] ${p.message}`); return; }
      if (p.done && (p.done - lastLog >= 10 || p.done === p.total)) {
        lastLog = p.done;
        console.log(`  ${p.done}/${p.total} agent | oxirgi: ${p.code} (${p.status}, ${p.count}/${p.expected})`);
      }
    },
  });

  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const agents = result?.agents || [];
  const totalUrls = agents.reduce((sum, a) => sum + (a.actualUrls || a.urls?.length || 0), 0);
  console.log(`\n=== TUGADI (${secs}s) ===`);
  console.log(`Agentlar: ${result?.totalAgents ?? "?"} | Fotoli: ${result?.totalAgentsWithPhotos ?? "?"} | Jami URL: ${totalUrls}`);
  console.log(`Rejim: ${result?.collectionMode} | Stats:`, result?.stats || {});
  console.log(`Fayl: ${outPath}`);

  try {
    // Server aynan shu manifestni o'qiydi (lmj_review_datasets.json).
    const manifestPath = join(DATA_ROOT, "outputs", "lmj_review_datasets.json");
    const manifestDate = brand && brand.id !== "lalaku_mama"
      ? `${targetDate} [${(brand.agentPrefixes?.[0] || "").toUpperCase()}]`
      : targetDate;
    await updateDatasetManifest(manifestPath, outPath, manifestDate, { source: "http", brand: brand?.id });
    console.log("Manifest yangilandi.");
  } catch (error) {
    console.warn("Manifest yangilanmadi:", String(error?.message || error));
  }
}

main().catch((error) => {
  console.error("\nXATO:", String(error?.message || error));
  process.exit(1);
});

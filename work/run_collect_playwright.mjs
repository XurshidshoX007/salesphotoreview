/**
 * Oddiy rejim: brauzer ochiladi, siz sanani qo'lda tanlaysiz, Enter bosasiz.
 *   npm run collect -- 2026-06-03
 */
import { chromium } from "playwright";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { platform } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import {
  collectLmjForSalesDate,
  isSalesDateSet,
  readSalesDateInput,
  updateDatasetManifest,
  projectRoot,
} from "./lmj_sales_browser_collect.mjs";
import { findBrand, loadBrandsConfig, publicBrand } from "../scripts/brand-config.mjs";

async function loadEnv() {
  const root = projectRoot();
  for (const name of [".env.local", ".env"]) {
    try {
      const text = await readFile(join(root, name), "utf8");
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

await loadEnv();

function yesterdayIsoDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const targetDate = process.argv[2] || yesterdayIsoDate();
const brandArg = process.argv.slice(3).join(" ");
const brandsConfig = await loadBrandsConfig({ includeDisabled: true });
const rawBrand = String(brandArg || process.env.BRAND_NAME || process.env.BRAND_PREFIX || "").trim();
const brand = findBrand(brandsConfig, rawBrand);
const publicSelectedBrand = brand ? publicBrand(brand) : null;
const brandPrefix = publicSelectedBrand?.code || "";
const brandName = publicSelectedBrand?.name || "";
const brandFilePrefix = publicSelectedBrand?.filePrefix || "";
const limitAgents = process.env.LIMIT ? Number(process.env.LIMIT) : Infinity;
const applyDate = process.env.APPLY_DATE === "1";
const loadImages = process.env.LOAD_IMAGES === "1";
const autoPrepare = process.env.AUTO_PREPARE === "1";
const keepBrowser = process.env.KEEP_BROWSER_AFTER_COLLECT === "1";
const collectBrowserPath = String(process.env.COLLECT_BROWSER_PATH || process.env.BROWSER_PATH || "").trim();
const collectBrowserChannel = String(process.env.COLLECT_BROWSER_CHANNEL || process.env.BROWSER_CHANNEL || "").trim().toLowerCase();

function isValidIsoDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y
    && date.getMonth() === m - 1
    && date.getDate() === d;
}

function displayDate(iso) {
  const [y, m, d] = String(iso).split("-");
  return y && m && d ? `${d}.${m}.${y}` : iso;
}

function browserSourceLabel(options = browserLaunchOptions()) {
  if (options.executablePath) return "tanlangan brauzer";
  if (options.channel) return `${options.channel} brauzeri`;
  return "ichki Chromium brauzeri";
}

function browserLaunchOptions() {
  const preferredChannel = collectBrowserChannel || (platform() === "win32" ? "msedge" : "");
  const options = {
    headless: false,
    viewport: null,
    args: [
      "--start-maximized",
      "--window-position=40,40",
      "--window-size=1280,900",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
    ],
  };

  if (collectBrowserPath) {
    if (existsSync(collectBrowserPath)) {
      options.executablePath = collectBrowserPath;
      return options;
    }
    console.log(`Ogohlantirish: COLLECT_BROWSER_PATH/BROWSER_PATH topilmadi: ${collectBrowserPath}`);
  }

  if (preferredChannel && !["chromium", "bundled", "default"].includes(preferredChannel)) {
    options.channel = preferredChannel;
  }
  return options;
}

async function launchCollectContext(userDataDir, persistent) {
  const options = browserLaunchOptions();
  const open = async (launchOptions) => {
    if (persistent) {
      return chromium.launchPersistentContext(userDataDir, launchOptions);
    }
    const { viewport, ...browserOptions } = launchOptions;
    const browser = await chromium.launch(browserOptions);
    const context = await browser.newContext({ viewport: viewport ?? null });
    context.__browser = browser;
    return context;
  };

  try {
    return await open(options);
  } catch (error) {
    if (options.channel || options.executablePath) {
      console.log(`Tanlangan brauzer ochilmadi (${error.message}). Ichki Chromium bilan qayta uriniladi.`);
      const fallback = {
        headless: false,
        viewport: null,
        args: [
          "--start-maximized",
          "--window-position=40,40",
          "--window-size=1280,900",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
        ],
      };
      return open(fallback);
    }
    throw error;
  }
}

function makeTab(page) {
  return {
    playwright: page,
    cua: {
      async click({ x, y }) {
        await page.mouse.click(x, y);
      },
      async keypress({ keys }) {
        if (keys.includes("CTRL") && keys.includes("A")) {
          await page.keyboard.press("Control+a");
          return;
        }
        if (keys.includes("ESC")) {
          await page.keyboard.press("Escape");
        }
      },
      async type({ text }) {
        await page.keyboard.type(text, { delay: 30 });
      },
    },
  };
}

async function waitEnter(message) {
  const rl = createInterface({ input, output });
  await rl.question(message);
  rl.close();
}

function salesCredentials() {
  return {
    username: String(process.env.SALES_USERNAME || process.env.SALES_LOGIN || "").trim(),
    password: String(process.env.SALES_PASSWORD || process.env.SALES_PASS || "").trim(),
  };
}

async function tryAutoSalesLogin(page) {
  const creds = salesCredentials();
  if (!creds.username || !creds.password) return false;
  const result = await page.evaluate(({ username, password }) => {
    const isVisible = (el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
    };
    const setValue = (el, value) => {
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (setter) setter.call(el, value);
      else el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const passwordInput = [...document.querySelectorAll("input[type='password']")].find(isVisible);
    if (!passwordInput) return { ok: false, reason: "password_input_not_found" };
    const form = passwordInput.closest("form") || document;
    const inputs = [...form.querySelectorAll("input")].filter((input) => {
      const type = String(input.getAttribute("type") || "text").toLowerCase();
      return isVisible(input)
        && input !== passwordInput
        && !["password", "hidden", "checkbox", "radio", "submit", "button", "file", "date"].includes(type);
    });
    const usernameInput = inputs.find((input) => /user|login|email|phone|tel|name/i.test(`${input.name} ${input.id} ${input.placeholder} ${input.autocomplete}`))
      || inputs[0];
    if (!usernameInput) return { ok: false, reason: "username_input_not_found" };
    setValue(usernameInput, username);
    setValue(passwordInput, password);
    passwordInput.focus();
    const buttons = [...form.querySelectorAll("button,input[type='submit'],input[type='button']")].filter(isVisible);
    const submit = buttons.find((button) => {
      const text = `${button.innerText || button.value || ""} ${button.getAttribute("aria-label") || ""}`;
      return /kirish|login|sign|войти|enter/i.test(text);
    }) || buttons.find((button) => String(button.getAttribute("type") || "").toLowerCase() === "submit") || buttons[0];
    if (submit) submit.click();
    else passwordInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true }));
    return { ok: true };
  }, creds).catch((error) => ({ ok: false, reason: error.message }));
  if (result.ok) {
    await page.keyboard.press("Enter").catch(() => {});
    await page.waitForTimeout(2500);
    return true;
  }
  return false;
}

async function waitForSalesDashboard(page) {
  const deadline = Date.now() + 15 * 60_000;
  let announcedLogin = false;
  let autoLoginAttempts = 0;
  let lastAutoLoginAt = 0;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => {
      const text = document.body?.innerText || "";
      const hasPassword = !!document.querySelector("input[type='password']");
      const hasDashboard = /Дашборд|Dashboard|Супервайзер|Supervisor|Отчет по эффективности|Фото отчеты/i.test(text);
      return { href: location.href, hasPassword, hasDashboard, title: document.title };
    }).catch(() => ({ href: page.url(), hasPassword: false, hasDashboard: false, title: "" }));

    if (/\/dashboard\/supervisor/i.test(state.href) && state.hasDashboard && !state.hasPassword) {
      console.log("Sales dashboard tayyor.");
      return;
    }

    if ((/login|auth|sign/i.test(state.href) || state.hasPassword) && !announcedLogin) {
      if (salesCredentials().username && salesCredentials().password) {
        console.log("Login kerak: .env.local dagi Sales login ma'lumotlari bilan avtomatik kirish urinilmoqda.");
      } else {
        console.log("Login kerak: server kompyuterida ochilgan brauzer oynasida Salesga kiring. Avtomatik login uchun .env.local ichiga SALES_USERNAME va SALES_PASSWORD yozing.");
      }
      announcedLogin = true;
    }
    if (state.hasPassword && autoLoginAttempts < 5 && Date.now() - lastAutoLoginAt > 5000) {
      autoLoginAttempts += 1;
      lastAutoLoginAt = Date.now();
      if (await tryAutoSalesLogin(page)) {
        console.log(`Sales login avtomatik yuborildi (${autoLoginAttempts}-urinish).`);
      }
    }

    if (!/\/dashboard\/supervisor/i.test(state.href) && !state.hasPassword) {
      await page.goto("https://lalaku.lalakusales.com/dashboard/supervisor", {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      }).catch(() => {});
    }
    await page.waitForTimeout(1500);
  }
  throw new Error("Sales dashboard 15 daqiqa ichida tayyor bo'lmadi. Login yoki sayt ochilishini tekshiring.");
}

async function main() {
  if (!isValidIsoDate(targetDate)) {
    console.error(`\nXATO: sana noto'g'ri: "${targetDate}"`);
    console.error("To'g'ri format: YYYY-MM-DD, masalan:");
    console.error("  npm run collect -- 2026-06-03 Lalaku mama\n");
    process.exit(1);
  }
  if (!brand) {
    console.error("\nXATO: brend nomini yozish shart.");
    console.error("Brendni id, nom, Sales nomi yoki agent prefix orqali yozish mumkin.");
    console.error("To'g'ri buyruqlar:");
    console.error("  npm run collect -- 2026-06-05 lalaku_mama");
    console.error("  npm run collect -- 2026-06-05 sof");
    console.error("  npm run collect -- 2026-06-05 Lalaku mama");
    console.error("  npm run collect -- 2026-06-05 Sof\n");
    console.error("Mavjud brendlar:");
    for (const item of brandsConfig.brands.filter((b) => b.enabled)) {
      console.error(`  - ${item.id}: ${item.name} (${(item.agentPrefixes || []).join(", ") || "prefix yo'q"})`);
    }
    process.exit(1);
  }
  if (!publicSelectedBrand.agentPrefixes.length) {
    console.error(`\nXATO: ${brandName} uchun agent prefix kiritilmagan. Agentlarni filterlash imkonsiz.\n`);
    process.exit(1);
  }

  const root = projectRoot();
  const outPath = join(root, "outputs", `${brandFilePrefix}_browser_collect_${targetDate}_raw.json`);
  const manifestPath = join(root, "outputs", "lmj_review_datasets.json");
  const manifestDate = publicSelectedBrand.id === "lalaku_mama" ? targetDate : `${targetDate} [${brandPrefix}]`;

  console.log(`\n=== ${brandPrefix} foto yig'ish (${brandName}) ===\n`);
  console.log(`1) ${browserSourceLabel()} oynasi ochiladi`);
  console.log(autoPrepare
    ? "2) Programma supervisor dashboard, sana va brendni avtomatik tayyorlaydi"
    : "2) https://lalaku.lalakusales.com ga kiring va login qiling");
  console.log(autoPrepare
    ? "3) Agar login so'ralsa, ochilgan brauzer oynasida bir marta login qiling"
    : "3) Supervisor dashboard oching");
  console.log(autoPrepare
    ? `4) Sana avtomatik qo'yiladi: ${targetDate} (${displayDate(targetDate)})\n`
    : `4) Sanani ${targetDate} (${displayDate(targetDate)}) qiling\n`);

  const browserProfileDir = join(root, "work", ".sales-browser-profile");
  const legacyProfileDir = join(root, "work", ".sales-chrome-profile");
  const userDataDir = existsSync(browserProfileDir) || !existsSync(legacyProfileDir)
    ? browserProfileDir
    : legacyProfileDir;
  await mkdir(userDataDir, { recursive: true });
  const ctx = await launchCollectContext(userDataDir, autoPrepare);
  const page = ctx.pages()[0] || await ctx.newPage();
  await page.goto("https://lalaku.lalakusales.com/dashboard/supervisor", {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });

  if (autoPrepare) {
    console.log("Avtomatik tayyorlash: dashboard kutilmoqda...");
    await waitForSalesDashboard(page);
  } else {
    await waitEnter(
      "\nDashboard va sana tayyor bo'lgach, shu yerga qayting va ENTER bosing (brauzerni yopmang)... ",
    );
  }

  if (!loadImages) {
    await ctx.route("**/*", async (route) => {
      const request = route.request();
      if (request.resourceType() === "image") {
        await route.abort();
        return;
      }
      await route.continue();
    });
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-delay: 0ms !important;
          transition-duration: 0.01ms !important;
          transition-delay: 0ms !important;
          scroll-behavior: auto !important;
        }
      `,
    }).catch(() => {});
    console.log("Tez rejim: rasm fayllari yuklanmaydi, faqat URL yig'iladi.");
  }

  const tab = makeTab(page);
  await page.bringToFront();

  const dateValue = await readSalesDateInput(tab);
  console.log("Hozirgi sana maydoni:", dateValue || "(bo'sh)");
  console.log(process.env.FORCE_DOM === "1"
    ? "Yig'ish rejimi: eski DOM/modal usuli."
    : "Yig'ish rejimi: API metadata bilan (klient + vaqt).");

  if (!applyDate && !autoPrepare && !(await isSalesDateSet(tab, targetDate))) {
    console.error(`\nXATO: Sales sahifasida sana ${targetDate} ko'rinmayapti.`);
    console.error(`Hozirgi sana maydoni: ${dateValue || "(bo'sh)"}`);
    console.error(`Sales dashboardda sanani ${displayDate(targetDate)} qilib, keyin ENTER bosing.`);
    console.error("Noto'g'ri sana yig'ilmasligi uchun collect to'xtatildi.\n");
    process.exit(1);
  }

  console.log(`\nYig'ish boshlandi (${limitAgents === Infinity ? "barcha agentlar" : limitAgents + " ta"})...\n`);
  if (autoPrepare && !applyDate) {
    console.log(`Avtomatik API sana rejimi: ${targetDate} date_range orqali yig'iladi.`);
  }

  const result = await collectLmjForSalesDate(tab, {
    targetDate,
    outPath,
    applyDate,
    limitAgents,
    brandPrefix,
    brandName,
    brand: publicSelectedBrand,
    progress: (p) => {
      if (p.type === "perf") {
        console.log(`[PERF] ${p.message}`);
        return;
      }
      const mark = p.ok ? "OK" : "!!";
      if (p.orderLookupStatus) {
        const orderError = p.orderLookupError ? ` (${String(p.orderLookupError).slice(0, 120)}...)` : "";
        console.log(`   zayavki: ${p.orderLookupStatus}${p.orderLookupScope ? `/${p.orderLookupScope}` : ""}${p.orderCount != null ? ` ${p.orderCount}` : ""}${p.orderPhotos ? `, foto-buyurtma ${p.orderPhotos}` : ""}${orderError}`);
      }
      console.log(
        `[${mark}] ${p.done}/${p.total} ${p.code} — ${p.count ?? 0}/${p.expected ?? "?"} ${p.status || p.error || ""}`,
      );
    },
  });

  await updateDatasetManifest(manifestPath, outPath, manifestDate, {
    label: `${targetDate} | ${brandName}`,
    brand: publicSelectedBrand,
  });
  console.log("\nTAYYOR:", outPath);
  console.log("Statistika:", result.stats);
  if (autoPrepare && !keepBrowser) {
    await ctx.close();
  } else {
    await waitEnter("\nBrauzerni yopish uchun ENTER... ");
    await ctx.close();
    await ctx.__browser?.close?.();
  }
}

main().catch((e) => {
  console.error("\nXATO:", e.message);
  process.exit(1);
});

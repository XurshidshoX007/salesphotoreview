import { chromium } from "playwright";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { platform } from "node:os";
import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SALES_URL = "https://lalaku.lalakusales.com/dashboard/supervisor";
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

function browserLaunchOptions() {
  const browserPath = String(process.env.COLLECT_BROWSER_PATH || process.env.BROWSER_PATH || "").trim();
  const browserChannel = String(process.env.COLLECT_BROWSER_CHANNEL || process.env.BROWSER_CHANNEL || "").trim().toLowerCase();
  const preferredChannel = browserChannel || (platform() === "win32" ? "msedge" : "");
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
  if (browserPath) {
    if (existsSync(browserPath)) {
      options.executablePath = browserPath;
      return options;
    }
    console.log(`Ogohlantirish: BROWSER_PATH topilmadi: ${browserPath}`);
  }
  if (preferredChannel && !["chromium", "bundled", "default"].includes(preferredChannel)) {
    options.channel = preferredChannel;
  }
  return options;
}

async function waitEnter(message) {
  const rl = createInterface({ input, output });
  await rl.question(message);
  rl.close();
}

async function isSalesReady(page) {
  return page.evaluate(() => {
    const text = document.body?.innerText || "";
    const hasPassword = !!document.querySelector("input[type='password']");
    const hasDashboard = /Dashboard|Supervisor|Фото отчеты|Фото отчёты|Супервайзер/i.test(text);
    return { href: location.href, hasPassword, hasDashboard, title: document.title };
  }).catch(() => ({ href: page.url(), hasPassword: false, hasDashboard: false, title: "" }));
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
    if (!passwordInput) return { ok: false };
    const form = passwordInput.closest("form") || document;
    const inputs = [...form.querySelectorAll("input")].filter((input) => {
      const type = String(input.getAttribute("type") || "text").toLowerCase();
      return isVisible(input)
        && input !== passwordInput
        && !["password", "hidden", "checkbox", "radio", "submit", "button", "file", "date"].includes(type);
    });
    const usernameInput = inputs.find((input) => /user|login|email|phone|tel|name/i.test(`${input.name} ${input.id} ${input.placeholder} ${input.autocomplete}`))
      || inputs[0];
    if (!usernameInput) return { ok: false };
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
  }, creds).catch(() => ({ ok: false }));
  if (result.ok) {
    await page.keyboard.press("Enter").catch(() => {});
    await page.waitForTimeout(2500);
    return true;
  }
  return false;
}

async function main() {
  await loadEnv();
  const browserProfileDir = join(ROOT, "work", ".sales-browser-profile");
  const legacyProfileDir = join(ROOT, "work", ".sales-chrome-profile");
  const userDataDir = existsSync(browserProfileDir) || !existsSync(legacyProfileDir)
    ? browserProfileDir
    : legacyProfileDir;
  await mkdir(userDataDir, { recursive: true });

  console.log("\n=== Sales login sessiyasini tayyorlash ===\n");
  console.log("Brauzer server kompyuterida ochiladi.");
  console.log("Salesga bir marta login qiling. Login/parol dasturga yozilmaydi, faqat brauzer profili saqlanadi.\n");

  const context = await chromium.launchPersistentContext(userDataDir, browserLaunchOptions());
  const page = context.pages()[0] || await context.newPage();
  await page.goto(SALES_URL, { waitUntil: "domcontentloaded", timeout: 120000 }).catch(() => {});
  await page.bringToFront().catch(() => {});

  const deadline = Date.now() + 15 * 60_000;
  let announced = false;
  let autoLoginAttempts = 0;
  let lastAutoLoginAt = 0;
  while (Date.now() < deadline) {
    const state = await isSalesReady(page);
    if (/\/dashboard\/supervisor/i.test(state.href) && state.hasDashboard && !state.hasPassword) {
      console.log("Sales login tayyor. Endi Cloudflare orqali hamkasblar ma'lumot yig'ishni ishlata oladi.");
      await context.close();
      return;
    }
    if (!announced) {
      console.log(salesCredentials().username && salesCredentials().password
        ? "Login oynasi chiqsa, .env.local dagi Sales login ma'lumotlari bilan avtomatik kirish uriniladi..."
        : "Login oynasi ochilgan bo'lsa, server kompyuteridagi brauzerda login qiling...");
      announced = true;
    }
    if (state.hasPassword && autoLoginAttempts < 5 && Date.now() - lastAutoLoginAt > 5000) {
      autoLoginAttempts += 1;
      lastAutoLoginAt = Date.now();
      if (await tryAutoSalesLogin(page)) console.log(`Sales login avtomatik yuborildi (${autoLoginAttempts}-urinish).`);
    }
    if (!/\/dashboard\/supervisor/i.test(state.href) && !state.hasPassword) {
      await page.goto(SALES_URL, { waitUntil: "domcontentloaded", timeout: 120000 }).catch(() => {});
    }
    await page.waitForTimeout(1500);
  }

  console.log("15 daqiqa ichida login tasdiqlanmadi.");
  await waitEnter("Brauzerni yopish uchun ENTER bosing...");
  await context.close();
}

main().catch((error) => {
  console.error("\nXATO:", error.message);
  process.exit(1);
});

import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { localEnv } from "./lib/review-test-auth.mjs";

const root = process.cwd();
const baseUrl = String(process.env.REVIEW_MOBILE_TEST_URL || "http://127.0.0.1:8896").replace(/\/$/, "");
const artifacts = join(root, "work", "test-artifacts");
const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='640' height='960'><rect width='640' height='960' fill='#d9efec'/><circle cx='320' cy='480' r='160' fill='#14958f'/></svg>";

async function ready() {
  try { return (await fetch(`${baseUrl}/api/access/status`, { signal: AbortSignal.timeout(1000) })).status < 500; } catch { return false; }
}

const env = await localEnv();
const pin = String(process.env.REVIEW_TEST_PIN || env.REVIEW_ACCESS_PIN || env.REVIEW_ACCESS_PASSWORD || "").trim();
assert(pin, "Mobile test uchun REVIEW_ACCESS_PIN topilmadi");
await mkdir(artifacts, { recursive: true });
let server = null;
if (!(await ready())) {
  const url = new URL(baseUrl);
  server = spawn(process.execPath, ["backend/src/server.mjs"], {
    cwd: root,
    env: { ...process.env, HOST: url.hostname, PORT: url.port, NO_OPEN: "1", MAINTENANCE_AUTO_APPLY: "0" },
    stdio: "ignore",
  });
  const deadline = Date.now() + 20_000;
  while (!(await ready())) {
    if (server.exitCode !== null) throw new Error(`Mobile test server yopildi: ${server.exitCode}`);
    if (Date.now() > deadline) throw new Error("Mobile test server ishga tushmadi");
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await context.route(/\/api\/photo\?/, (route) => route.fulfill({ status: 200, contentType: "image/svg+xml", body: svg }));
  const login = await context.request.post(`${baseUrl}/api/access/login`, { data: { pin } });
  assert(login.ok(), `Mobile login xato: HTTP ${login.status()}`);
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(`${baseUrl}/lmj_date_photo_review.html`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForSelector("#grid .card");
  await page.waitForFunction(() => [...document.querySelectorAll("#grid .photoFrame img")].some((image) => image.naturalWidth > 0), null, { timeout: 20_000 });
  const layout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    card: document.querySelector("#grid .card")?.getBoundingClientRect().toJSON(),
    navButtonHeight: document.querySelector("#quickNav button")?.getBoundingClientRect().height || 0,
    header: document.querySelector("body > header")?.getBoundingClientRect().toJSON(),
    gridColumns: getComputedStyle(document.querySelector("#grid")).gridTemplateColumns.split(" ").filter(Boolean).length,
    navScrollable: document.querySelector(".salesNav")?.scrollWidth > document.querySelector(".salesNav")?.clientWidth,
    headerCssHeight: getComputedStyle(document.querySelector("body > header")).height,
    stylesheet: [...document.styleSheets].map((sheet) => sheet.href).filter(Boolean),
  }));
  assert(layout.overflow <= 1, `Mobile overflow: ${layout.overflow}`);
  assert(layout.card && layout.card.width > 0 && layout.card.right <= 391, "Mobile foto kartasi sig'madi");
  assert(layout.navButtonHeight >= 44, `Mobile tugma kichik: ${layout.navButtonHeight}`);
  assert(layout.header?.height <= 74, `Mobile header baland: ${layout.header?.height}`);
  assert.equal(layout.gridColumns, 1, `Mobile foto to'ri bitta ustunda emas: ${layout.gridColumns}`);
  assert(layout.navScrollable, "Mobile yuqori menyusi suriladigan emas");
  await page.locator("#grid .card").first().click({ timeout: 8_000 });
  await page.waitForFunction(() => document.querySelector("#modal")?.classList.contains("open"), null, { timeout: 8_000 });
  await page.waitForTimeout(220);
  const modalLayout = await page.locator("#modal").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const image = element.querySelector(".modalImgBox")?.getBoundingClientRect();
    return { top: rect.top, width: rect.width, height: rect.height, opacity: style.opacity, imageHeight: image?.height || 0 };
  });
  assert.equal(modalLayout.top, 0, "Mobile modal yuqoridan ochilmadi");
  assert.equal(modalLayout.width, 390, "Mobile modal ekranga to'liq sig'madi");
  assert.equal(modalLayout.opacity, "1", "Mobile modal yarim shaffof qoldi");
  assert(modalLayout.imageHeight >= 220, `Mobile rasm maydoni kichik: ${modalLayout.imageHeight}`);
  await page.locator(".modalImgBox").click({ button: "right", timeout: 8_000 });
  await page.waitForFunction(() => !document.querySelector("#reasonContextMenu")?.hidden, null, { timeout: 8_000 });
  await page.waitForTimeout(220);
  assert(await page.locator("#reasonContextBackdrop").isVisible(), "Mobile sabab menyusi fonsiz ochildi");
  const menu = await page.locator("#reasonContextMenu").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, item: element.querySelector(".reasonContextItem")?.getBoundingClientRect().height || 0, width: innerWidth, height: innerHeight };
  });
  assert(menu.left >= 0 && menu.right <= menu.width + 1 && menu.top >= 0 && menu.bottom <= menu.height + 1, "Sabab menyusi mobile ekranga sig'madi");
  assert(menu.item >= 44, `Sabab touch maydoni kichik: ${menu.item}`);
  await page.screenshot({ path: join(artifacts, "review-mobile.png"), fullPage: false });
  assert.equal(errors.length, 0, `Mobile console xatolari: ${errors.join(" | ")}`);
  console.log("Review mobile UI: OK | 390px, touch targets, modal va sabab menyusi");
} finally {
  await browser.close();
  server?.kill();
}

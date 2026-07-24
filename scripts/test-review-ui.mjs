import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import { localEnv } from "./lib/review-test-auth.mjs";

const root = process.cwd();
const baseUrl = String(process.env.REVIEW_TEST_URL || "http://127.0.0.1:8876").replace(/\/$/, "");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const env = await localEnv();
const pin = String(process.env.REVIEW_TEST_PIN || env.REVIEW_ACCESS_PIN || env.REVIEW_ACCESS_PASSWORD || "").trim();
const pageUrl = `${baseUrl}/lmj_date_photo_review.html`;
const artifacts = join(root, "work", "test-artifacts");
await mkdir(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 950 },
    deviceScaleFactor: 1,
  });
  const loginResponse = await context.request.post(`${baseUrl}/api/access/login`, { data: { pin } });
  assert(loginResponse.ok(), `UI test login xato: HTTP ${loginResponse.status()}`);
  const page = await context.newPage();
  if (process.env.CI) {
    await page.route(/\/api\/photo\?/, async (route) => {
      const variant = new URL(route.request().url()).searchParams.get("view") || "full";
      await route.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        headers: { "X-Photo-Variant": variant },
        body: "<svg xmlns='http://www.w3.org/2000/svg' width='640' height='960'><rect width='640' height='960' fill='#d9efec'/></svg>",
      });
    });
  }
  const consoleErrors = [];
  let expectedPhotoFailure = false;
  page.on("console", (message) => {
    if (expectedPhotoFailure && message.type() === "error" && message.text().includes("Failed to load resource")) return;
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForSelector("#grid .card .photoFrame img", { timeout: 30_000 });
  await page.waitForFunction(() => [...document.querySelectorAll("#grid .photoFrame img")].some((img) => img.naturalWidth > 0), null, { timeout: 30_000 });

  const imageState = await page.locator("#grid .photoFrame img").first().evaluate((img) => ({
    fit: getComputedStyle(img).objectFit,
    position: getComputedStyle(img).objectPosition,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    mode: img.dataset.mode,
    variant: img.dataset.variant,
  }));
  assert(imageState.fit === "contain", `Grid rasmi contain emas: ${imageState.fit}`);
  assert(imageState.naturalWidth > 0 && imageState.naturalHeight > 0, "Grid rasmi yuklanmadi");
  assert(imageState.variant === "thumb", "Grid thumbnail rejimida emas");
  await page.screenshot({ path: join(artifacts, "review-ui-photos.png"), fullPage: false });

  await page.locator("#filterToggleBtn").click();
  assert(await page.locator("#filterToggleBtn").getAttribute("aria-expanded") === "true", "Filtr paneli ochilmadi");
  assert(await page.locator("#reviewFilters").getAttribute("aria-hidden") === "false", "Filtr paneli yashirin holatda qoldi");
  await page.locator("#filterCloseBtn").click();
  assert(await page.locator("#filterToggleBtn").getAttribute("aria-expanded") === "false", "Filtr paneli yopilmadi");

  await page.locator("#systemStatusBtn").click();
  assert(await page.locator("#systemStatusPanel").getAttribute("aria-hidden") === "false", "Tizim holati paneli ochilmadi");
  await page.waitForFunction(() => document.querySelectorAll("#systemStatusRows > *").length >= 4, null, { timeout: 15_000 });
  await page.locator("#systemStatusClose").click();

  await page.locator("#grid .card").first().click();
  await page.waitForFunction(() => document.querySelector("#modalImg")?.naturalWidth > 0, null, { timeout: 30_000 });
  const modalState = await page.locator("#modalImg").evaluate((img) => ({
    variant: img.dataset.variant,
    width: img.naturalWidth,
    height: img.naturalHeight,
  }));
  assert(modalState.variant === "full", "Modal original/full rasm rejimida emas");
  assert(modalState.width > 0 && modalState.height > 0, "Modal rasmi yuklanmadi");
  await page.locator("#modalClose").click();

  expectedPhotoFailure = true;
  const fallbackState = await page.evaluate(async () => {
    const waitFor = (check, timeout = 5000) => new Promise((resolve, reject) => {
      const started = Date.now();
      const poll = () => {
        if (check()) return resolve();
        if (Date.now() - started > timeout) return reject(new Error("Photo fallback timeout"));
        setTimeout(poll, 30);
      };
      poll();
    });
    const makeFrame = () => {
      const frame = document.createElement("div");
      frame.className = "photoFrame";
      frame.hidden = true;
      const img = document.createElement("img");
      img.onload = () => window.PhotoReviewPhotoLoader.imageLoaded(img);
      img.onerror = () => window.PhotoReviewPhotoLoader.imageError(img);
      frame.append(img);
      document.body.append(frame);
      return { frame, img };
    };
    const successful = makeFrame();
    window.PhotoReviewPhotoLoader.load(
      successful.img,
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3Crect width='2' height='2' fill='teal'/%3E%3C/svg%3E",
      "proxy",
      "thumb"
    );
    await waitFor(() => successful.frame.classList.contains("loaded"));
    const broken = makeFrame();
    window.PhotoReviewPhotoLoader.load(broken.img, "data:text/plain,not-an-image", "proxy", "thumb");
    await waitFor(() => broken.frame.classList.contains("broken"));
    const result = {
      fallbackMode: successful.img.dataset.mode,
      loaded: successful.frame.classList.contains("loaded"),
      broken: broken.frame.classList.contains("broken"),
    };
    successful.frame.remove();
    broken.frame.remove();
    return result;
  });
  expectedPhotoFailure = false;
  assert(fallbackState.loaded && fallbackState.fallbackMode === "direct", "Proxy xatosidan direct fallback ishlamadi");
  assert(fallbackState.broken, "Proxy va direct xatosidan keyin broken holati chiqmadi");

  const remainderAgent = await page.locator("#agentSel option").evaluateAll((options) => {
    for (const option of options) {
      const count = Number(option.textContent.match(/\|\s*(\d+)\s+foto/)?.[1] || 0);
      if (count > 4 && count % 4 === 1) return { value: option.value, count };
    }
    return null;
  });
  if (remainderAgent) {
    await page.locator("#agentSel").evaluate((select, value) => {
      select.value = value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }, remainderAgent.value);
    await page.locator("#photoPageSize").evaluate((input) => {
      input.value = "4";
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    for (let pageIndex = 1; pageIndex < Math.ceil(remainderAgent.count / 4); pageIndex += 1) {
      await page.locator("#quickNext").click();
    }
    await page.waitForFunction(() => [...document.querySelectorAll("#grid .photoFrame img")].every((img) => img.naturalWidth > 0), null, { timeout: 30_000 });
    const finalPage = await page.locator("#grid").evaluate((grid) => {
      const card = grid.querySelector(".card");
      const gridBox = grid.getBoundingClientRect();
      const cardBox = card?.getBoundingClientRect();
      return {
        count: grid.querySelectorAll(".card").length,
        columns: grid.dataset.columns,
        cardRatio: cardBox ? cardBox.width / gridBox.width : 1,
      };
    });
    assert(finalPage.count === 1, `Oxirgi sahifada 1 ta o'rniga ${finalPage.count} ta foto bor`);
    assert(finalPage.columns === "4", `Oxirgi sahifa 4 ustun rejimida emas: ${finalPage.columns}`);
    assert(finalPage.cardRatio < 0.32, `Oxirgi foto kengayib ketgan: ${(finalPage.cardRatio * 100).toFixed(1)}%`);
  }

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 1, `Gorizontal overflow bor: ${overflow}px`);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  const mobileLayout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    cardWidth: document.querySelector("#grid .card")?.getBoundingClientRect().width || 0,
    viewport: document.documentElement.clientWidth,
  }));
  assert(mobileLayout.overflow <= 1, `Mobile gorizontal overflow bor: ${mobileLayout.overflow}px`);
  assert(mobileLayout.cardWidth > 0 && mobileLayout.cardWidth <= mobileLayout.viewport, `Mobile foto kengligi noto'g'ri: ${mobileLayout.cardWidth}px`);
  await page.screenshot({ path: join(artifacts, "review-ui-mobile.png"), fullPage: false });

  await page.setViewportSize({ width: 1600, height: 950 });
  await page.locator("#sideBrandSettingsBtn").click();
  await page.waitForFunction(() => document.querySelector("#brandPanel")?.classList.contains("open"));
  await page.waitForFunction(() => document.querySelectorAll("#brandList .brandItem").length > 0, null, { timeout: 15_000 });
  assert(Boolean(await page.locator("#brandNameInput").inputValue()), "Brend formasi cache/server ma'lumoti bilan to'lmadi");
  assert(await page.locator("#deleteDateBtn").isVisible(), "Brend sozlamalarida umumiy Yopish tugmasi ko'rinmadi");
  await page.locator("#deleteDateBtn").click();

  await page.locator("#sideMinusListBtn").click();
  await page.waitForFunction(() => document.querySelector("#minusList")?.classList.contains("open"));
  await page.waitForFunction(() => (document.querySelector("#listBody")?.innerText || "").trim().length > 20, null, { timeout: 15_000 });
  assert(await page.locator("#deleteDateBtn").isVisible(), "Minus ro'yxatida umumiy Yopish tugmasi ko'rinmadi");
  await page.locator("#deleteDateBtn").click();

  await page.locator("#sideAttendanceBtn").click();
  await page.waitForFunction(() => document.querySelector("#attendancePanel")?.classList.contains("open"));
  await page.waitForFunction(() => !/yuklanmoqda/i.test(document.querySelector("#attendanceMeta")?.textContent || ""), null, { timeout: 20_000 });

  await page.locator("#sideAdminStatsBtn").click();
  await page.waitForFunction(() => document.querySelector("#adminStatsPanel")?.classList.contains("open"));
  await page.waitForFunction(() => (document.querySelector("#adminStatsBody")?.innerText || "").trim().length > 20, null, { timeout: 20_000 });

  await page.locator("#sideCollectBtn").click();
  await page.waitForFunction(() => document.querySelector("#collectPanel")?.classList.contains("open"));
  assert((await page.locator("#collectPanel").innerText()).includes("Jarayon holati"), "Ma'lumot yig'ish holati ko'rinmadi");
  assert(await page.locator("#sectionCloseBtn").isVisible(), "Ma'lumot yig'ishda Yopish tugmasi ko'rinmadi");
  await page.locator("#sectionCloseBtn").click();
  await page.locator("#sidePhotoBtn").click();

  const finalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(finalOverflow <= 1, `Bo'limlardan qaytganda gorizontal overflow bor: ${finalOverflow}px`);
  assert(consoleErrors.length === 0, `Console xatolari: ${consoleErrors.join(" | ")}`);
  await page.screenshot({ path: join(artifacts, "review-ui-desktop.png"), fullPage: false });
  console.log(`Review UI OK | image ${imageState.naturalWidth}x${imageState.naturalHeight} contain | modal/fallback/mobile | all views | remainder ${remainderAgent ? "checked" : "datasetda yo'q"}`);
} finally {
  await browser.close();
}

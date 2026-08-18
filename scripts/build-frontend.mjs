import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mappings = [
  ["frontend/src/api/client.js", "outputs/review-ui/js/data-loader.js"],
  ["frontend/src/state/reviewState.js", "outputs/review-ui/js/state.js"],
  ["frontend/src/features/filters.js", "outputs/review-ui/js/filters.js"],
  ["frontend/src/features/marks.js", "outputs/review-ui/js/marks.js"],
  ["frontend/src/features/brands.js", "outputs/review-ui/js/brands.js"],
  ["frontend/src/features/attendance.js", "outputs/review-ui/js/attendance.js"],
  ["frontend/src/features/datasetAutoLoad.js", "outputs/review-ui/js/dataset-auto-load.js"],
  ["frontend/src/features/photoLoader.js", "outputs/review-ui/js/photo-loader.js"],
  ["frontend/src/features/utils.js", "outputs/review-ui/js/utils.js"],
  ["frontend/src/features/uiState.js", "outputs/review-ui/js/ui-state.js"],
  ["frontend/src/features/counters.js", "outputs/review-ui/js/counters.js"],
  ["frontend/src/features/autoReview.js", "outputs/review-ui/js/auto-review.js"],
  ["frontend/src/features/telegramUi.js", "outputs/review-ui/js/telegram.js"],
  ["frontend/src/features/export.js", "outputs/review-ui/js/export.js"],
  ["frontend/src/app.js", "outputs/review-ui/js/app.js"],
];
const apiBase = String(process.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");
for (const [sourceName, outputName] of mappings) {
  let source = await readFile(join(root, sourceName), "utf8");
  source = source.replaceAll("__VITE_API_BASE_URL__", apiBase);
  const output = join(root, outputName);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, source, "utf8");
}

const reviewHtml = await readFile(join(root, "outputs/review-ui/index.html"), "utf8");
await writeFile(join(root, "outputs/lmj_date_photo_review.html"), reviewHtml, "utf8");

console.log(`Frontend build: ${mappings.length} modul + public HTML | API ${apiBase || "same-origin"}`);

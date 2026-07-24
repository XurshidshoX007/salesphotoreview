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
];
const apiBase = String(process.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");
for (const [sourceName, outputName] of mappings) {
  let source = await readFile(join(root, sourceName), "utf8");
  source = source.replaceAll("__VITE_API_BASE_URL__", apiBase);
  const output = join(root, outputName);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, source, "utf8");
}
console.log(`Frontend build: ${mappings.length} modul | API ${apiBase || "same-origin"}`);

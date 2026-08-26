import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createPostgresService } from "../backend/src/services/postgres.service.mjs";

const root = resolve(process.env.DATA_DIR || process.cwd());
const readJson = async (path, fallback) => {
  try { return JSON.parse(await readFile(path, "utf8")); } catch (error) { if (error?.code === "ENOENT") return fallback; throw error; }
};
const database = createPostgresService();
if (!database.enabled()) throw new Error("DATABASE_URL sozlanmagan");
try {
  const [marks, reasons, brands] = await Promise.all([
    readJson(join(root, "outputs", "lmj_review_marks.json"), {}),
    readJson(join(root, "outputs", "lmj_review_reasons.json"), {}),
    readJson(join(root, "config", "brands.json"), {}),
  ]);
  await database.migrate();
  await database.replaceReviewMarks(marks);
  await database.saveDocument("review-reasons", reasons);
  await database.saveDocument("brands", brands);
  const summary = await database.mirrorSummary();
  if (summary.marks !== Object.keys(marks).length) throw new Error(`PostgreSQL marks soni mos emas: ${summary.marks} / ${Object.keys(marks).length}`);
  console.log(`PostgreSQL JSON mirror: ${summary.marks} marks, ${summary.documents.join(", ")}`);
} finally {
  await database.close();
}

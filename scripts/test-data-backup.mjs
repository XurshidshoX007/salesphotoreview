import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createDataBackup, restoreDataBackup, verifyDataBackup } from "../backend/src/services/data-backup.service.mjs";

const root = await mkdtemp(join(tmpdir(), "review-backup-"));
const dataRoot = join(root, "data-root");
const restoreRoot = join(root, "restore");
try {
  await mkdir(join(dataRoot, "outputs"), { recursive: true });
  await mkdir(join(dataRoot, "data", "attendance"), { recursive: true });
  await mkdir(join(dataRoot, "config"), { recursive: true });
  await writeFile(join(dataRoot, "outputs", "lmj_review_marks.json"), '{"minus":true}\n');
  await writeFile(join(dataRoot, "data", "attendance", "month.json"), '{"agent":"A"}\n');
  await writeFile(join(dataRoot, "config", "brands.json"), '{"brands":[]}\n');
  await writeFile(join(dataRoot, "outputs", "ignore.txt"), "ignore");
  const createdAt = new Date();
  const backup = await createDataBackup({ dataRoot, now: createdAt, retention: 2 });
  assert.equal(backup.files, 3);
  assert.equal((await verifyDataBackup(backup.backupPath)).files, 3);
  const skipped = await createDataBackup({ dataRoot, now: new Date(createdAt.getTime() + 30 * 60 * 1000), minimumAgeMs: 2 * 60 * 60 * 1000 });
  assert.equal(skipped.skipped, true);
  await restoreDataBackup({ backupPath: backup.backupPath, targetRoot: restoreRoot });
  assert.equal(await readFile(join(restoreRoot, "outputs", "lmj_review_marks.json"), "utf8"), '{"minus":true}\n');
  assert.equal(await readFile(join(restoreRoot, "data", "attendance", "month.json"), "utf8"), '{"agent":"A"}\n');
  console.log("Data backup tests: OK");
} finally {
  await rm(root, { recursive: true, force: true });
}

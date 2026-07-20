import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { gunzip, gzip } from "node:zlib";
import { promisify } from "node:util";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);
const root = resolve(process.cwd());
const apply = process.argv.includes("--apply");

function numberArg(name, fallback) {
  const token = process.argv.find((value) => value.startsWith(`${name}=`));
  const parsed = Number(token?.slice(name.length + 1));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

const cacheDays = numberArg("--cache-days", Number(process.env.PHOTO_CACHE_RETENTION_DAYS || 1));
const backupDays = numberArg("--backup-days", Number(process.env.ATTENDANCE_BACKUP_RETENTION_DAYS || 14));
const artifactDays = numberArg("--artifact-days", Number(process.env.TEST_ARTIFACT_RETENTION_DAYS || 14));
const now = Date.now();

function insideWorkspace(path) {
  const target = resolve(path);
  return target === root || target.startsWith(`${root}${sep}`);
}

function assertSafe(path) {
  if (!insideWorkspace(path)) throw new Error(`Workspace tashqarisidagi yo'l rad etildi: ${path}`);
}

async function filesUnder(directory) {
  const absolute = resolve(directory);
  assertSafe(absolute);
  if (!existsSync(absolute)) return [];
  const output = [];
  const stack = [absolute];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) stack.push(path);
      else if (entry.isFile()) output.push(path);
    }
  }
  return output;
}

function olderThan(info, days) {
  return now - info.mtimeMs > days * 24 * 60 * 60 * 1000;
}

function digest(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

const report = { cache: { files: 0, bytes: 0 }, artifacts: { files: 0, bytes: 0 }, backups: { files: 0, bytes: 0, archivedBytes: 0 } };

async function cleanFiles(directory, days, bucket) {
  for (const file of await filesUnder(directory)) {
    const info = await stat(file);
    if (!olderThan(info, days)) continue;
    report[bucket].files += 1;
    report[bucket].bytes += info.size;
    if (apply) await unlink(file);
  }
}

async function archiveBackups() {
  const sourceRoot = resolve(root, "data", "attendance", "backups");
  const archiveRoot = resolve(root, "data", "attendance", "archive");
  assertSafe(sourceRoot);
  assertSafe(archiveRoot);
  for (const file of await filesUnder(sourceRoot)) {
    if (!/\.json$/i.test(file)) continue;
    const info = await stat(file);
    if (!olderThan(info, backupDays)) continue;
    report.backups.files += 1;
    report.backups.bytes += info.size;
    if (!apply) continue;

    const month = `${info.mtime.getFullYear()}-${String(info.mtime.getMonth() + 1).padStart(2, "0")}`;
    const target = join(archiveRoot, month, `${basename(file)}.gz`);
    const temporary = `${target}.tmp-${process.pid}`;
    assertSafe(target);
    await mkdir(dirname(target), { recursive: true });
    const source = await readFile(file);
    const compressed = await gzipAsync(source, { level: 9 });
    await writeFile(temporary, compressed, { flag: "wx" });
    const restored = await gunzipAsync(await readFile(temporary));
    if (source.length !== restored.length || digest(source) !== digest(restored)) {
      await unlink(temporary).catch(() => {});
      throw new Error(`Arxiv tekshiruvi o'tmadi: ${relative(root, file)}`);
    }
    if (existsSync(target)) {
      const existing = await gunzipAsync(await readFile(target));
      if (digest(existing) !== digest(source)) throw new Error(`Arxiv nomi to'qnashdi: ${relative(root, target)}`);
      await unlink(temporary);
    } else {
      await rename(temporary, target);
    }
    report.backups.archivedBytes += compressed.length;
    await unlink(file);
  }
}

await cleanFiles(join(root, "work", ".photo-cache"), cacheDays, "cache");
await cleanFiles(join(root, "work", "test-artifacts"), artifactDays, "artifacts");
await archiveBackups();

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
console.log(`${apply ? "APPLY" : "DRY-RUN"} maintenance`);
console.log(`Photo cache: ${report.cache.files} fayl, ${mb(report.cache.bytes)} MB (${cacheDays} kundan eski)`);
console.log(`Test artifacts: ${report.artifacts.files} fayl, ${mb(report.artifacts.bytes)} MB (${artifactDays} kundan eski)`);
console.log(`Attendance backup: ${report.backups.files} fayl, ${mb(report.backups.bytes)} MB (${backupDays} kundan eski)`);
if (apply && report.backups.files) console.log(`Siqilgan backup hajmi: ${mb(report.backups.archivedBytes)} MB`);
if (!apply) console.log("Hech narsa o'chirilmadi. Amalga oshirish: npm run maintenance:apply");

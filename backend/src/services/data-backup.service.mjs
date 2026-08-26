import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";
import { createGunzip, createGzip } from "node:zlib";

const MANIFEST_NAME = "manifest.json";

function sha256() {
  return createHash("sha256");
}

function safeRelative(root, path) {
  const output = relative(root, path);
  if (!output || output.startsWith(`..${sep}`) || output === ".." || output.includes(`..${sep}`)) {
    throw new Error(`Backup yo'li xavfsiz emas: ${path}`);
  }
  return output;
}

function snapshotName(now = new Date()) {
  return now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

async function filesUnder(root, source, output = []) {
  if (!existsSync(source)) return output;
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const path = join(source, entry.name);
    const rel = safeRelative(root, path);
    if (entry.isDirectory()) {
      if (/(^|[\\/])(backups?|archive)([\\/]|$)/i.test(rel)) continue;
      await filesUnder(root, path, output);
    } else if (entry.isFile() && /\.json$/i.test(entry.name)) {
      output.push(path);
    }
  }
  return output;
}

async function selectedFiles(dataRoot) {
  const files = [];
  await filesUnder(dataRoot, join(dataRoot, "outputs"), files);
  await filesUnder(dataRoot, join(dataRoot, "data"), files);
  const brands = join(dataRoot, "config", "brands.json");
  if (existsSync(brands)) files.push(brands);
  return [...new Set(files)].sort();
}

async function gzipFile(source, target) {
  const digest = sha256();
  let bytes = 0;
  const checksum = new Transform({
    transform(chunk, _encoding, callback) {
      digest.update(chunk);
      bytes += chunk.length;
      callback(null, chunk);
    },
  });
  await mkdir(dirname(target), { recursive: true });
  await pipeline(createReadStream(source), checksum, createGzip({ level: 9 }), createWriteStream(target, { flags: "wx" }));
  const compressed = await readFile(target);
  return { bytes, sha256: digest.digest("hex"), gzipBytes: compressed.length, gzipSha256: sha256().update(compressed).digest("hex") };
}

async function verifyEntry(backupPath, entry) {
  const compressedPath = join(backupPath, `${entry.path}.gz`);
  const compressed = await readFile(compressedPath);
  if (compressed.length !== entry.gzipBytes || sha256().update(compressed).digest("hex") !== entry.gzipSha256) {
    throw new Error(`Backup fayli buzilgan: ${entry.path}`);
  }
  const digest = sha256();
  let bytes = 0;
  const checksum = new Transform({
    transform(chunk, _encoding, callback) {
      digest.update(chunk);
      bytes += chunk.length;
      callback(null, chunk);
    },
  });
  await pipeline(createReadStream(compressedPath), createGunzip(), checksum, new Transform({ transform(_chunk, _encoding, callback) { callback(); } }));
  if (bytes !== entry.bytes || digest.digest("hex") !== entry.sha256) throw new Error(`Backup tekshiruvi o'tmadi: ${entry.path}`);
}

export async function verifyDataBackup(backupPath) {
  const root = resolve(backupPath);
  const manifest = JSON.parse(await readFile(join(root, MANIFEST_NAME), "utf8"));
  if (manifest.version !== 1 || !Array.isArray(manifest.files)) throw new Error("Backup manifest formati noto'g'ri");
  for (const entry of manifest.files) {
    if (!entry?.path || !Number.isFinite(entry.bytes) || !/^[a-f0-9]{64}$/i.test(entry.sha256 || "")) {
      throw new Error("Backup manifestida noto'g'ri fayl bor");
    }
    safeRelative(root, join(root, entry.path));
    await verifyEntry(root, entry);
  }
  return { backupPath: root, files: manifest.files.length, bytes: manifest.files.reduce((sum, entry) => sum + entry.bytes, 0) };
}

export async function createDataBackup({ dataRoot = process.env.DATA_DIR || process.cwd(), backupRoot, retention = 7, minimumAgeMs = 0, now = new Date() } = {}) {
  const sourceRoot = resolve(dataRoot);
  const destinationRoot = resolve(backupRoot || join(sourceRoot, "data", "backups", "review-snapshots"));
  if (destinationRoot === sourceRoot || !destinationRoot.startsWith(`${sourceRoot}${sep}`)) {
    throw new Error("Backup DATA_DIR ichidagi alohida papkada bo'lishi kerak");
  }
  const name = snapshotName(now);
  const target = join(destinationRoot, name);
  const temporary = join(destinationRoot, `.${name}.tmp-${process.pid}`);
  if (existsSync(target)) throw new Error(`Backup allaqachon mavjud: ${name}`);
  await mkdir(destinationRoot, { recursive: true });
  const existingSnapshots = (await readdir(destinationRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^\d{8}T\d{6}Z$/.test(entry.name))
    .map((entry) => join(destinationRoot, entry.name))
    .sort();
  const latest = existingSnapshots.at(-1);
  if (latest && Number(minimumAgeMs) > 0) {
    const age = now.getTime() - (await stat(latest)).mtimeMs;
    if (age >= 0 && age < Number(minimumAgeMs)) return { skipped: true, backupPath: latest, files: 0, bytes: 0 };
  }
  await mkdir(temporary, { recursive: true });
  try {
    const files = [];
    for (const source of await selectedFiles(sourceRoot)) {
      const path = safeRelative(sourceRoot, source);
      files.push({ path, ...(await gzipFile(source, join(temporary, `${path}.gz`))) });
    }
    const manifest = { version: 1, createdAt: now.toISOString(), source: "review-data", files };
    await writeFile(join(temporary, MANIFEST_NAME), `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
    await verifyDataBackup(temporary);
    await rename(temporary, target);

    const snapshots = (await readdir(destinationRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && /^\d{8}T\d{6}Z$/.test(entry.name))
      .map((entry) => join(destinationRoot, entry.name))
      .sort();
    for (const stale of snapshots.slice(0, Math.max(0, snapshots.length - Math.max(1, Number(retention) || 7)))) {
      await rm(stale, { recursive: true, force: true });
    }
    return { backupPath: target, files: files.length, bytes: files.reduce((sum, entry) => sum + entry.bytes, 0) };
  } catch (error) {
    await rm(temporary, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

export async function restoreDataBackup({ backupPath, targetRoot }) {
  const backup = resolve(backupPath);
  const target = resolve(targetRoot);
  const manifest = JSON.parse(await readFile(join(backup, MANIFEST_NAME), "utf8"));
  const entries = manifest.files || [];
  if (existsSync(target) && (await readdir(target)).length) throw new Error("Restore manzili bo'sh bo'lishi kerak");
  await verifyDataBackup(backup);
  for (const entry of entries) {
    const destination = join(target, entry.path);
    safeRelative(target, destination);
    await mkdir(dirname(destination), { recursive: true });
    await pipeline(createReadStream(join(backup, `${entry.path}.gz`)), createGunzip(), createWriteStream(destination, { flags: "wx" }));
  }
  return { targetRoot: target, files: entries.length };
}

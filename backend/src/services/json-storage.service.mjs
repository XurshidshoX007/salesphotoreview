import { existsSync } from "node:fs";
import { copyFile, mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";

const writeQueues = new Map();

function serializedJson(value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  JSON.parse(text);
  return text;
}

async function durableWrite(path, text) {
  const temp = `${path}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
  const handle = await open(temp, "wx");
  try {
    await handle.writeFile(text, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await rename(temp, path);
  } catch (error) {
    await unlink(temp).catch(() => {});
    throw error;
  }
}

export function queueJsonWrite(path, value, { validate, backup = true } = {}) {
  const absolute = String(path);
  const previous = writeQueues.get(absolute) || Promise.resolve();
  const job = previous.catch(() => {}).then(async () => {
    if (validate && !validate(value)) throw new Error(`JSON validation xato: ${absolute}`);
    const text = serializedJson(value);
    await mkdir(dirname(absolute), { recursive: true });
    if (backup && existsSync(absolute)) {
      await copyFile(absolute, `${absolute}.bak`).catch(() => {});
    }
    await durableWrite(absolute, text);
    return value;
  });
  writeQueues.set(absolute, job);
  job.finally(() => {
    if (writeQueues.get(absolute) === job) writeQueues.delete(absolute);
  }).catch(() => {});
  return job;
}

export async function readJsonResilient(path, fallback, { validate } = {}) {
  const candidates = [String(path), `${path}.bak`];
  let lastError = null;
  for (const candidate of candidates) {
    try {
      const value = JSON.parse(await readFile(candidate, "utf8"));
      if (validate && !validate(value)) throw new Error(`JSON validation xato: ${candidate}`);
      if (candidate.endsWith(".bak")) {
        await queueJsonWrite(path, value, { validate, backup: false });
      }
      return value;
    } catch (error) {
      if (error?.code !== "ENOENT") lastError = error;
    }
  }
  if (fallback !== undefined) return structuredClone(fallback);
  throw lastError || new Error(`JSON fayl topilmadi: ${path}`);
}

export function pendingJsonWrites() {
  return Promise.allSettled([...writeQueues.values()]);
}

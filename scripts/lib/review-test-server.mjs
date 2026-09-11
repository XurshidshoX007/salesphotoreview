import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, mkdtemp, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

// Test serveri hech qachon haqiqiy data/ ichiga yozmasligi kerak. DATA_DIR
// vaqtinchalik papkaga qaratiladi; server topilmagan fayllarni baribir
// loyihadagi outputs/ dan o'qiydi, shuning uchun datasetlar ko'rinib turadi,
// lekin marks/tabel yozuvlari real fayllarni buzmaydi.
export async function isolatedDataDir(prefix = "review-test-", { root = process.cwd() } = {}) {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  // Foto disk keshi — bu shunchaki kesh, uni ulashsa test tarmoqqa bog'lanib
  // qolmaydi va rasmlar oldingidek tez yuklanadi. Xavfli yozuvlar (marks,
  // tabel, brendlar) baribir vaqtinchalik papkada qoladi.
  const photoCache = join(root, "work", ".photo-cache");
  if (existsSync(photoCache)) {
    await mkdir(join(dir, "work"), { recursive: true });
    await symlink(photoCache, join(dir, "work", ".photo-cache"), "junction").catch(() => {});
  }
  // Marks/sabablar testlari mavjud yozuvlar ustida ishlaydi. Nusxa olinadi,
  // shuning uchun test ularni o'zgartirsa ham asl fayllar tegilmaydi.
  // Datasetlarning o'zi nusxalanmaydi: server topilmagan faylni loyihadagi
  // outputs/ dan o'qiydi, demak ular baribir ko'rinadi.
  await mkdir(join(dir, "outputs"), { recursive: true });
  for (const name of ["lmj_review_marks.json", "lmj_review_reasons.json", "lmj_suspicious_photos.json"]) {
    const source = join(root, "outputs", name);
    if (existsSync(source)) await cp(source, join(dir, "outputs", name));
  }
  // Tabel testlari haqiqiy xodim/marshrut ro'yxatini talab qiladi. Nusxa
  // olamiz: test generatsiya qilgan oylar nusxaga tushadi, asl fayllar tegilmaydi.
  // archive/ (187 MB) va backups/ kerak emas.
  const attendance = join(root, "data", "attendance");
  if (existsSync(attendance)) {
    await cp(attendance, join(dir, "data", "attendance"), {
      recursive: true,
      filter: (source) => {
        if (source.endsWith(".bak")) return false;
        const top = relative(attendance, source).split(/[\\/]/)[0];
        return top !== "archive" && top !== "backups";
      },
    });
  }
  return dir;
}

async function isReady(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/api/access/status`, {
      signal: AbortSignal.timeout(1500),
    });
    return response.status < 500;
  } catch {
    return false;
  }
}

export async function ensureReviewTestServer(baseUrl, root) {
  if (await isReady(baseUrl)) return null;

  const target = new URL(baseUrl);
  const child = spawn(process.execPath, ["backend/src/server.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      HOST: target.hostname,
      PORT: target.port || "80",
      NO_OPEN: "1",
      DATA_DIR: process.env.DATA_DIR || await isolatedDataDir(),
      MAINTENANCE_AUTO_APPLY: "0",
    },
    stdio: "ignore",
  });
  child.unref();
  process.once("exit", () => {
    if (child.exitCode === null) child.kill();
  });

  const deadline = Date.now() + 15_000;
  while (!(await isReady(baseUrl))) {
    if (child.exitCode !== null) {
      throw new Error(`Test server ishga tushmadi: exit ${child.exitCode}`);
    }
    if (Date.now() > deadline) {
      child.kill();
      throw new Error("Test server 15 soniyada tayyor bo'lmadi");
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return child;
}

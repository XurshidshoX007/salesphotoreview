import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { appendFile, mkdir, open, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const WORK = join(ROOT, "work");
const PORT = Number(process.env.PORT || 8765);
const HOST = process.env.HOST || "127.0.0.1";
const LOCAL_BASE_URL = `http://127.0.0.1:${PORT}`;
const REVIEW_PATH = "/lmj_date_photo_review.html";
const ENV_LOCAL = join(ROOT, ".env.local");
const LOG_FILE = join(WORK, "cloudflare_tunnel.log");
const SERVER_OUT = join(WORK, "public_review_server.out.log");
const SERVER_ERR = join(WORK, "public_review_server.err.log");

async function loadEnvFile(name) {
  try {
    const text = await readFile(join(ROOT, name), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // Optional env file.
  }
}

async function loadEnv() {
  await loadEnvFile(".env.local");
  await loadEnvFile(".env");
}

function maskSecret(value) {
  const text = String(value || "");
  if (!text) return "";
  return `${text.slice(0, 6)}...${createHash("sha256").update(text).digest("hex").slice(0, 8)}`;
}

async function ensureAccessToken() {
  const existing = String(process.env.REVIEW_ACCESS_TOKEN || process.env.APP_ACCESS_TOKEN || "").trim();
  if (existing) return existing;
  const token = randomBytes(18).toString("hex");
  const prefix = existsSync(ENV_LOCAL) ? "\n" : "";
  await appendFile(ENV_LOCAL, `${prefix}REVIEW_ACCESS_TOKEN=${token}\n`, "utf8");
  process.env.REVIEW_ACCESS_TOKEN = token;
  console.log(".env.local ichiga REVIEW_ACCESS_TOKEN yaratildi.");
  return token;
}

async function ensureAccessPin() {
  const existing = String(process.env.REVIEW_ACCESS_PIN || process.env.REVIEW_ACCESS_PASSWORD || "").trim();
  if (existing) return existing;
  const pin = String(100000 + Math.floor(Math.random() * 900000));
  const prefix = existsSync(ENV_LOCAL) ? "\n" : "";
  await appendFile(ENV_LOCAL, `${prefix}REVIEW_ACCESS_PIN=${pin}\n`, "utf8");
  process.env.REVIEW_ACCESS_PIN = pin;
  console.log(".env.local ichiga REVIEW_ACCESS_PIN yaratildi.");
  return pin;
}

async function canReachReviewServer(token) {
  try {
    const res = await fetch(`${LOCAL_BASE_URL}/api/admin/telegram-stats?access=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(1200),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function canReachPinLogin() {
  if (!String(process.env.REVIEW_ACCESS_PIN || process.env.REVIEW_ACCESS_PASSWORD || "").trim()) return true;
  try {
    const res = await fetch(`${LOCAL_BASE_URL}${REVIEW_PATH}`, {
      signal: AbortSignal.timeout(1200),
    });
    const text = await res.text();
    return res.status === 401 && text.includes("Kirish himoyalangan");
  } catch {
    return false;
  }
}

async function waitForReviewServer(token) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (await canReachReviewServer(token)) return true;
    await new Promise((resolve) => setTimeout(resolve, 700));
  }
  return false;
}

async function portLooksFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "127.0.0.1");
  });
}

async function stopExistingReviewServer() {
  console.log("8765 portda eski review server bor. Tartibli to'xtatilyapti...");
  await new Promise((resolve) => {
    const child = spawn(process.execPath, ["work/stop_review_server.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, PORT: String(PORT) },
    });
    child.on("exit", () => resolve());
    child.on("error", () => resolve());
  });
  await new Promise((resolve) => setTimeout(resolve, 1200));
}

async function startReviewServer(token) {
  if ((await canReachReviewServer(token)) && (await canReachPinLogin())) {
    console.log(`Review server tayyor: ${LOCAL_BASE_URL}`);
    return;
  }
  if (!(await portLooksFree(PORT))) {
    await stopExistingReviewServer();
    if (!(await portLooksFree(PORT))) {
      throw new Error(`Port ${PORT} band. Eski server yopilmadi yoki boshqa dastur ishlatyapti.`);
    }
  }

  await mkdir(WORK, { recursive: true });
  const out = await open(SERVER_OUT, "a");
  const err = await open(SERVER_ERR, "a");
  const child = spawn(process.execPath, ["work/run_review_server.mjs"], {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", out.fd, err.fd],
    env: {
      ...process.env,
      HOST,
      PORT: String(PORT),
      NO_OPEN: "1",
      REVIEW_ACCESS_TOKEN: token,
      REVIEW_ACCESS_PIN: process.env.REVIEW_ACCESS_PIN || process.env.REVIEW_ACCESS_PASSWORD || "",
    },
  });
  child.unref();
  console.log(`Review server ishga tushdi: PID ${child.pid}`);
  if (!(await waitForReviewServer(token))) {
    throw new Error("Review server 20 sekund ichida tayyor bo'lmadi. work/public_review_server.err.log ni tekshiring.");
  }
}

function reviewUrl(publicBaseUrl, token) {
  const base = String(publicBaseUrl || "").replace(/\/+$/, "");
  if (String(process.env.REVIEW_ACCESS_PIN || process.env.REVIEW_ACCESS_PASSWORD || "").trim()) {
    return `${base}${REVIEW_PATH}`;
  }
  return `${base}${REVIEW_PATH}?access=${encodeURIComponent(token)}`;
}

function cloudflaredArgs() {
  const token = String(process.env.CLOUDFLARE_TUNNEL_TOKEN || "").trim();
  const name = String(process.env.CLOUDFLARE_TUNNEL_NAME || "").trim();
  const common = ["tunnel", "--no-autoupdate", "--edge-ip-version", "4", "--compression-quality", "1"];
  if (token) return { mode: "token", args: [...common, "run", "--token", token] };
  if (name) return { mode: "named", args: [...common, "run", name] };
  return {
    mode: "quick",
    args: [...common, "--proxy-keepalive-connections", "200", "--proxy-keepalive-timeout", "2m", "--url", LOCAL_BASE_URL],
  };
}

async function startTunnel(token) {
  await mkdir(WORK, { recursive: true });
  await writeFile(LOG_FILE, `Cloudflare tunnel start: ${new Date().toISOString()}\n`, "utf8");

  const { mode, args } = cloudflaredArgs();
  const publicUrlFromEnv = String(process.env.CLOUDFLARE_PUBLIC_URL || "").trim();
  const child = spawn("cloudflared", args, {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });

  console.log(`Cloudflare tunnel rejimi: ${mode}`);
  if (mode === "token") console.log(`Tunnel token: ${maskSecret(process.env.CLOUDFLARE_TUNNEL_TOKEN)}`);
  if (publicUrlFromEnv) {
    console.log("");
    console.log("Doimiy link:");
    console.log(reviewUrl(publicUrlFromEnv, token));
    console.log("");
  } else if (mode !== "quick") {
    console.log("");
    console.log("CLOUDFLARE_PUBLIC_URL .env.local ichida yozilsa, script tayyor linkni avtomatik ko'rsatadi.");
    console.log("");
  }

  let printedQuickUrl = false;
  const handleOutput = async (buffer, isError = false) => {
    const text = buffer.toString();
    await appendFile(LOG_FILE, text, "utf8").catch(() => {});
    const lines = text.split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      if (isError && /error|failed|invalid/i.test(line)) console.log(line);
      const match = line.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
      if (match && !printedQuickUrl) {
        printedQuickUrl = true;
        console.log("");
        console.log("Vaqtinchalik Cloudflare link:");
        console.log(reviewUrl(match[0], token));
        console.log("");
        console.log("Doimiy link uchun .env.local ga CLOUDFLARE_TUNNEL_TOKEN va CLOUDFLARE_PUBLIC_URL qo'ying.");
        console.log("");
      }
    }
  };

  child.stdout.on("data", (data) => handleOutput(data));
  child.stderr.on("data", (data) => handleOutput(data, true));
  child.on("exit", (code) => {
    console.log(`cloudflared yopildi. Code: ${code}`);
  });
}

await loadEnv();
const token = await ensureAccessToken();
const pin = await ensureAccessPin();
await startReviewServer(token);
console.log(`Umumiy PIN/parol: ${pin}`);
console.log(`Lokal review: ${reviewUrl(LOCAL_BASE_URL, token)}`);
await startTunnel(token);

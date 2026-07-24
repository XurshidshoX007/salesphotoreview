import { once } from "node:events";
import { createServer as createNetServer } from "node:net";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readResponseBuffer } from "../backend/src/lib/http-body.mjs";
import { queueJsonWrite, readJsonResilient } from "../backend/src/services/json-storage.service.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function freePort() {
  const server = createNetServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Test server erta yopildi: ${child.exitCode}`);
    try {
      const response = await fetch(baseUrl, { redirect: "manual" });
      if (response.status === 401) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error("Test server ishga tushmadi");
}

const root = process.cwd();
const dataDir = await mkdtemp(join(tmpdir(), "review-security-"));
const port = await freePort();
const baseUrl = `http://127.0.0.1:${port}`;
const pin = "482951";
const child = spawn(process.execPath, ["backend/src/server.mjs"], {
  cwd: root,
  env: {
    ...process.env,
    PORT: String(port),
    HOST: "127.0.0.1",
    NO_OPEN: "1",
    DATA_DIR: dataDir,
    REVIEW_ACCESS_PIN: pin,
    REVIEW_ACCESS_TOKEN: "legacy-token-must-not-work",
    REVIEW_ACCESS_SESSION_SECRET: "test-only-session-secret-at-least-32-characters",
    REVIEW_ACCESS_SESSION_MAX_AGE_SECONDS: "1",
    TRUST_CLOUDFLARE_PROXY: "1",
    MAINTENANCE_AUTO_APPLY: "0",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
child.stdout.on("data", (chunk) => { serverLog += chunk; });
child.stderr.on("data", (chunk) => { serverLog += chunk; });

try {
  await waitForServer(baseUrl, child);

  const unauth = await fetch(`${baseUrl}/api/sync?light=1`);
  assert(unauth.status === 401, `Authsiz API 401 emas: ${unauth.status}`);
  assert(unauth.headers.get("x-frame-options") === "DENY", "X-Frame-Options yo'q");
  assert((unauth.headers.get("content-security-policy") || "").includes("frame-ancestors 'none'"), "CSP yo'q");

  const legacy = await fetch(`${baseUrl}/api/sync?light=1&access=legacy-token-must-not-work`);
  assert(legacy.status === 401, "URL access token hali ham kirishga ruxsat berdi");

  for (let index = 1; index <= 5; index += 1) {
    const response = await fetch(`${baseUrl}/api/access/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": "203.0.113.10" },
      body: JSON.stringify({ pin: "wrong" }),
    });
    assert(response.status === (index === 5 ? 429 : 401), `${index}-xato urinish statusi ${response.status}`);
  }

  const login = await fetch(`${baseUrl}/api/access/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "CF-Connecting-IP": "203.0.113.11" },
    body: JSON.stringify({ pin }),
  });
  assert(login.ok, `To'g'ri PIN login bo'lmadi: ${login.status}`);
  const setCookie = login.headers.get("set-cookie") || "";
  assert(setCookie.includes("HttpOnly"), "Cookie HttpOnly emas");
  assert(setCookie.includes("SameSite=Lax"), "Cookie SameSite=Lax emas");
  assert(setCookie.includes("Path=/"), "Cookie Path=/ emas");
  assert(setCookie.includes("Max-Age=1"), "Cookie expiry noto'g'ri");
  assert(!setCookie.includes("Secure"), "Lokal HTTP cookie Secure bo'lib qoldi");
  const cookie = setCookie.split(";")[0];

  const protectedResponse = await fetch(`${baseUrl}/api/sync?light=1`, { headers: { Cookie: cookie } });
  assert(protectedResponse.ok, "Sessiya bilan API ochilmadi");

  const ssrf = await fetch(`${baseUrl}/api/photo?url=${encodeURIComponent("http://127.0.0.1/private.jpg")}`, {
    headers: { Cookie: cookie },
  });
  assert([400, 403].includes(ssrf.status), `Private IP proxy bloklanmadi: ${ssrf.status}`);

  const secureLogin = await fetch(`${baseUrl}/api/access/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CF-Connecting-IP": "203.0.113.12",
      "X-Forwarded-Proto": "https",
    },
    body: JSON.stringify({ pin }),
  });
  assert((secureLogin.headers.get("set-cookie") || "").includes("Secure"), "HTTPS proxy cookie Secure emas");

  const logout = await fetch(`${baseUrl}/api/access/logout`, {
    method: "POST",
    headers: { Cookie: cookie },
    redirect: "manual",
  });
  assert(logout.status === 303, `Logout statusi noto'g'ri: ${logout.status}`);
  const replay = await fetch(`${baseUrl}/api/sync?light=1`, { headers: { Cookie: cookie } });
  assert(replay.status === 401, "Logoutdan keyin eski sessiya ishlayapti");

  const expiringLogin = await fetch(`${baseUrl}/api/access/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "CF-Connecting-IP": "203.0.113.13" },
    body: JSON.stringify({ pin }),
  });
  const expiringCookie = (expiringLogin.headers.get("set-cookie") || "").split(";")[0];
  await new Promise((resolve) => setTimeout(resolve, 1_100));
  const expired = await fetch(`${baseUrl}/api/sync?light=1`, { headers: { Cookie: expiringCookie } });
  assert(expired.status === 401, "Muddati tugagan sessiya ishlayapti");

  const oversized = new Response(new Uint8Array(32), {
    headers: { "Content-Length": "32", "Content-Type": "image/png" },
  });
  await assertRejects(() => readResponseBuffer(oversized, { maxBytes: 16 }), 413, "Katta foto bloklanmadi");

  const jsonPath = join(dataDir, "parallel.json");
  await Promise.all(Array.from({ length: 50 }, (_, index) => queueJsonWrite(jsonPath, { index })));
  const parallel = JSON.parse(await readFile(jsonPath, "utf8"));
  assert(Number.isInteger(parallel.index), "Parallel JSON yozuv buzildi");
  await queueJsonWrite(jsonPath, { healthy: true });
  await queueJsonWrite(jsonPath, { latest: true });
  await writeFile(jsonPath, "{broken", "utf8");
  const recovered = await readJsonResilient(jsonPath, {});
  assert(recovered.healthy === true, "JSON backupdan tiklanmadi");

  console.log("Review security OK | PIN session, rate limit, logout, expiry, headers, SSRF, size limit, atomic JSON");
} finally {
  child.kill();
  await Promise.race([once(child, "exit"), new Promise((resolve) => setTimeout(resolve, 3_000))]).catch(() => {});
  await rm(dataDir, { recursive: true, force: true });
  if (child.exitCode && child.exitCode !== 0) console.error(serverLog);
}

async function assertRejects(run, status, message) {
  try {
    await run();
  } catch (error) {
    assert(Number(error?.status) === status, `${message}: status ${error?.status || "yo'q"}`);
    return;
  }
  throw new Error(message);
}

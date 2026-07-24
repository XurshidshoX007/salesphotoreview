import { spawn } from "node:child_process";

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

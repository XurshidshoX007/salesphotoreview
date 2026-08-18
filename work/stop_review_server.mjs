import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const PORT = String(process.env.PORT || 8765);

async function windowsPids() {
  const { stdout } = await execFileAsync("netstat", ["-ano"]);
  const pids = new Set();
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.includes(`:${PORT}`) || !/\bLISTENING\b/i.test(line)) continue;
    const pid = line.trim().split(/\s+/).at(-1);
    if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
  }
  return [...pids];
}

async function unixPids() {
  try {
    const { stdout } = await execFileAsync("lsof", ["-ti", `tcp:${PORT}`, `-sTCP:LISTEN`]);
    return [...new Set(stdout.split(/\r?\n/).map((item) => item.trim()).filter((pid) => /^\d+$/.test(pid)))];
  } catch (error) {
    if (error?.code === 1 || Number(error?.code) === 1) return [];
    try {
      const { stdout } = await execFileAsync("ss", ["-ltnp", `sport = :${PORT}`]);
      return [...new Set([...stdout.matchAll(/pid=(\d+)/g)].map((match) => match[1]))];
    } catch {
      return [];
    }
  }
}

async function killPid(pid) {
  if (process.platform === "win32") {
    await execFileAsync("taskkill", ["/PID", pid, "/T", "/F"]);
    return;
  }
  try {
    process.kill(Number(pid), "SIGTERM");
  } catch {
    await execFileAsync("kill", ["-TERM", pid]);
  }
}

try {
  const pids = process.platform === "win32" ? await windowsPids() : await unixPids();
  if (!pids.length) {
    console.log(`Review server topilmadi: 127.0.0.1:${PORT}`);
    process.exit(0);
  }
  for (const pid of pids) {
    await killPid(pid);
    console.log(`Review server yopildi: PID ${pid}`);
  }
} catch (error) {
  console.error(`Review serverni yopishda xato: ${error.message || error}`);
  process.exit(1);
}

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const PORT = String(process.env.PORT || 8765);

async function netstat() {
  const { stdout } = await execFileAsync("netstat", ["-ano"]);
  return stdout;
}

function reviewPids(output) {
  const pids = new Set();
  for (const line of output.split(/\r?\n/)) {
    if (!line.includes(`:${PORT}`) || !/\bLISTENING\b/i.test(line)) continue;
    const pid = line.trim().split(/\s+/).at(-1);
    if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
  }
  return [...pids];
}

async function killPid(pid) {
  await execFileAsync("taskkill", ["/PID", pid, "/T", "/F"]);
}

try {
  const pids = reviewPids(await netstat());
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

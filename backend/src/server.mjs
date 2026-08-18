import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnvText } from "./lib/env.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

async function loadEnvironment() {
  for (const name of [".env.local", ".env"]) {
    const file = join(ROOT, name);
    if (!existsSync(file)) continue;
    parseEnvText(await readFile(file, "utf8"));
  }
}

// Environment must be ready before the compatibility server evaluates its
// PORT, DATA_DIR and collect mode constants.
await loadEnvironment();
await import("../../work/run_review_server.mjs");

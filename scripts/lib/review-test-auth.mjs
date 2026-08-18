import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseEnvText } from "../../backend/src/lib/env.mjs";

export async function localEnv(root = process.cwd()) {
  const values = {};
  for (const name of [".env.local", ".env"]) {
    const file = join(root, name);
    if (!existsSync(file)) continue;
    Object.assign(values, parseEnvText(await readFile(file, "utf8"), values, { override: false }));
  }
  return values;
}

export async function reviewAuth(baseUrl, env = null) {
  const values = env || await localEnv();
  const pin = String(process.env.REVIEW_TEST_PIN || values.REVIEW_ACCESS_PIN || values.REVIEW_ACCESS_PASSWORD || "").trim();
  if (!pin) throw new Error("Test uchun REVIEW_ACCESS_PIN topilmadi");
  const response = await fetch(`${baseUrl}/api/access/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Test login xato: HTTP ${response.status} ${body.error || ""}`);
  const cookie = String(response.headers.get("set-cookie") || "").split(";")[0];
  if (!cookie) throw new Error("Test login session cookie qaytarmadi");
  return {
    pin,
    cookie,
    headers: { Cookie: cookie },
  };
}

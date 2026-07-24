import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function localEnv(root = process.cwd()) {
  const values = {};
  for (const name of [".env.local", ".env"]) {
    const file = join(root, name);
    if (!existsSync(file)) continue;
    const text = await readFile(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!match || values[match[1]]) continue;
      values[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
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

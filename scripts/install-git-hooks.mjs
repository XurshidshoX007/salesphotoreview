// Maxfiy fayllar git'ga tushib ketmasligi uchun pre-commit hook o'rnatadi.
// Bir marta ishga tushiring: npm run hooks:install
import { chmod, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HOOK_DIR = join(ROOT, ".git", "hooks");
const HOOK = join(HOOK_DIR, "pre-commit");

// `.env` allaqachon bir marta commit qilinib, bot tokeni public repoga
// tushgan edi. Bu hook shu xatoni takrorlanishdan to'xtatadi.
const BLOCKED = String.raw`^\.env$|^\.env\.local$|sales-chrome-profile|\.photo-cache|data/attendance/(backups|archive)/|\.pem$|\.key$|\.p12$`;

const script = `#!/bin/sh
# scripts/install-git-hooks.mjs tomonidan yaratilgan. Qo'lda tahrirlamang.
staged=$(git diff --cached --name-only --diff-filter=AM)
blocked=$(printf '%s\\n' "$staged" | grep -E '${BLOCKED}' || true)
if [ -n "$blocked" ]; then
  echo "XATO: maxfiy yoki katta fayl commit qilinmoqda:"
  printf '  %s\\n' $blocked
  echo ""
  echo "Bu fayllar git tarixida qolib ketadi va uni tozalash og'ir."
  echo "Ataylab bo'lsa: git commit --no-verify"
  exit 1
fi
`;

if (!existsSync(join(ROOT, ".git"))) {
  console.error("Bu papka git repo emas.");
  process.exit(1);
}
await mkdir(HOOK_DIR, { recursive: true });
await writeFile(HOOK, script, "utf8");
await chmod(HOOK, 0o755).catch(() => {});
console.log(`pre-commit hook o'rnatildi: ${HOOK}`);
console.log("Bloklanadi: .env, .env.local, chrome profili, photo-cache, attendance backup/archive, *.pem/key/p12");

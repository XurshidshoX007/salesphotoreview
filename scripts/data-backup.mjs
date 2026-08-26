import { createDataBackup } from "../backend/src/services/data-backup.service.mjs";

const retentionToken = process.argv.find((value) => value.startsWith("--retention="));
const minimumAgeToken = process.argv.find((value) => value.startsWith("--minimum-age-hours="));
const retention = Number(retentionToken?.slice("--retention=".length) || process.env.REVIEW_BACKUP_RETENTION_DAYS || 7);
const minimumAgeMs = Math.max(0, Number(minimumAgeToken?.slice("--minimum-age-hours=".length) || 0)) * 60 * 60 * 1000;
const result = await createDataBackup({ retention, minimumAgeMs });
if (result.skipped) {
  console.log(`Backup o'tkazib yuborildi: mavjud snapshot hali yangi (${result.backupPath})`);
  process.exit(0);
}
console.log(`Backup tayyor: ${result.files} fayl, ${(result.bytes / 1024 / 1024).toFixed(1)} MB`);
console.log(result.backupPath);

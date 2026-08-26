import { createDataBackup } from "../backend/src/services/data-backup.service.mjs";

const retentionToken = process.argv.find((value) => value.startsWith("--retention="));
const retention = Number(retentionToken?.slice("--retention=".length) || process.env.REVIEW_BACKUP_RETENTION_DAYS || 7);
const result = await createDataBackup({ retention });
console.log(`Backup tayyor: ${result.files} fayl, ${(result.bytes / 1024 / 1024).toFixed(1)} MB`);
console.log(result.backupPath);

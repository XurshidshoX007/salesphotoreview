#!/usr/bin/env node
import("./attendance-core.mjs")
  .then(async ({ exportAttendanceCsv }) => {
    const [month, brandId = ""] = process.argv.slice(2);
    if (!month) throw new Error("Usage: npm run attendance:export -- 2026-06 sof");
    const result = await exportAttendanceCsv({ month, brandId });
    console.log(`Attendance CSV: ${result.file}`);
  })
  .catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });

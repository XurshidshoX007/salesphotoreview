#!/usr/bin/env node
import("./attendance-core.mjs")
  .then(async ({ generateAttendanceMonth }) => {
    const [month, brandId = ""] = process.argv.slice(2);
    if (!month) throw new Error("Usage: npm run attendance:generate -- 2026-06 sof");
    const data = await generateAttendanceMonth({ month, brandId });
    console.log(`Attendance generated: ${data.month} ${data.brandId || ""}`);
    console.log(`Rows: ${data.rows.length}`);
  })
  .catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });

#!/usr/bin/env node
import("./attendance-core.mjs")
  .then(async ({ loadAttendanceStore, validateAttendanceData }) => {
    const store = await loadAttendanceStore();
    const result = validateAttendanceData(store);
    if (result.errors.length) {
      console.log("Errors:");
      result.errors.forEach((error) => console.log(`- ${error}`));
    }
    if (result.warnings.length) {
      console.log("Warnings:");
      result.warnings.forEach((warning) => console.log(`- ${warning}`));
    }
    if (!result.ok) process.exit(1);
    console.log("Attendance config OK");
  })
  .catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });

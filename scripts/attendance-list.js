#!/usr/bin/env node
import("./attendance-core.mjs")
  .then(async ({ loadAttendanceMonth, loadAttendanceStore }) => {
    const [month, brandId = ""] = process.argv.slice(2);
    if (month) {
      const data = await loadAttendanceMonth({ month, brandId });
      console.log(`${data.month} ${data.brandId || ""}`);
      for (const row of data.rows) {
        console.log(`${row.agentCode} | ${row.employeeName} | work=${row.summary.workDays} low=${row.summary.lowPhotoDays} special=${row.summary.specialDays} penalty=${row.summary.penaltyCount}`);
      }
      return;
    }
    const store = await loadAttendanceStore();
    console.log(`Employees: ${store.employees.length}`);
    console.log(`Routes: ${store.routes.length}`);
    console.log(`Assignments: ${store.assignments.length}`);
  })
  .catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });

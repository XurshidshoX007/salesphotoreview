import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const testRoot = await mkdtemp(join(tmpdir(), "attendance-test-"));
process.env.DATA_DIR = testRoot;
const {
  FILES,
  DEFAULT_SETTINGS,
  attendanceHistory,
  attendanceIssuesFromMonth,
  bulkSaveOverrides,
  calculateAgentMonthlySummary,
  findAssignmentForDate,
  generateAttendanceMonth,
  getDailyAttendanceValue,
  loadAttendanceMonth,
  plannedWorkDaysFor,
  prepareReplaceEmployee,
  resetOverride,
  safeWriteJson,
  saveOverride,
  setAttendanceMonthStatus,
  validateAttendanceData,
  validateManualValue,
} = await import(`./attendance-core.mjs?test=${Date.now()}`);
const {
  normalizeSupervisorTeamResult,
  normalizeSupervisorTeams,
} = await import(`../work/lmj_sales_browser_collect.mjs?test=${Date.now()}`);

const rules = DEFAULT_SETTINGS.attendanceRules;

assert.deepEqual(
  normalizeSupervisorTeams(
    [{
      id: "svr-sales-1",
      code: "LMJAN001",
      full_name: "SUPERVISOR TEST",
      branch: { name: "Andijon" },
      agents: ["LMJAN F - [ALI TEST]", "LMJAN F - [VALI TEST]"],
    }],
    { brand: { id: "lalaku_mama", name: "Lalaku Mama", agentPrefixes: ["LMJ"], salesBrandNames: ["Lalaku mama"], enabled: true } },
    [
      { code: "LMJAN01", name: "LMJAN F - [ALI TEST]" },
      { code: "LMJAN02", name: "LMJAN F - [VALI TEST]" },
    ],
  ).map((team) => ({ supervisorCode: team.supervisorCode, agentCodes: team.agentCodes, region: team.region })),
  [{ supervisorCode: "LMJAN001", agentCodes: ["LMJAN01", "LMJAN02"], region: "Andijon" }],
);

const supervisorNormalization = normalizeSupervisorTeamResult(
  [
    {
      code: "SVR001",
      full_name: "ACTIVE SVR",
      active: true,
      agents: [{ agent: { id: "agent-jy-1", code: "JY001", name: "JY A [ALI TEST]" } }],
    },
    {
      code: "SVR002",
      full_name: "INACTIVE SVR",
      active: false,
      agents: [{ agent: { id: "agent-jy-1", code: "JY001", name: "JY A [ALI TEST]" } }],
    },
    {
      code: "SVR003",
      full_name: "OTHER BRAND",
      active: true,
      agents: [{ agent: { code: "MONNO001", name: "JY A [ALI TEST]" } }],
    },
    {
      code: "SVR004",
      full_name: "VACANT TEAM",
      active: true,
      agents: ["JYAN J [VAKANT]"],
    },
  ],
  { brand: { id: "sof", name: "SOF", agentPrefixes: ["JY"], salesBrandNames: ["SOF"], enabled: true } },
  [
    { agentId: "agent-jy-1", code: "JY001", name: "JY A [ALI TEST]" },
    { agentId: "agent-jy-vacant", code: "JYAN101", name: "JYAN J [VAKANT]" },
  ],
);
assert.deepEqual(
  supervisorNormalization.teams.map((team) => ({ supervisorCode: team.supervisorCode, agentCodes: team.agentCodes })),
  [{ supervisorCode: "SVR001", agentCodes: ["JY001"] }],
);
assert.equal(supervisorNormalization.activeSourceCount, 3);

assert.deepEqual(
  calculateAgentMonthlySummary(
    [{ finalValue: 20 }, { finalValue: 21 }, { finalValue: 18 }, { finalValue: "19s" }],
    { name: "Agent" },
    rules,
  ),
  { workDays: 3, lowPhotoDays: 1, specialDays: 1, penaltyCount: 0 },
);

assert.deepEqual(
  calculateAgentMonthlySummary(
    [{ finalValue: 18 }, { finalValue: 17 }, { finalValue: 0 }, { finalValue: 20 }],
    { name: "Agent" },
    rules,
  ),
  { workDays: 1, lowPhotoDays: 3, specialDays: 0, penaltyCount: 1 },
);

const assignments = [
  { agentCode: "JY001", employeeId: "emp_ali", startDate: "2026-06-01", endDate: "2026-06-04" },
  { agentCode: "JY001", employeeId: "emp_vali", startDate: "2026-06-05", endDate: null },
];
assert.equal(findAssignmentForDate("JY001", "2026-06-04", assignments).employeeId, "emp_ali");
assert.equal(findAssignmentForDate("JY001", "2026-06-05", assignments).employeeId, "emp_vali");

assert.deepEqual(
  calculateAgentMonthlySummary([{ finalValue: 25 }], { isVacant: true, name: "Vacant" }, rules),
  { workDays: 0, lowPhotoDays: 0, specialDays: 0, penaltyCount: 0 },
);
assert.deepEqual(
  calculateAgentMonthlySummary([{ finalValue: 25 }, { finalValue: 0 }], { employeeId: "emp_vacant", employeeName: "VAKANT" }, rules),
  { workDays: 0, lowPhotoDays: 0, specialDays: 0, penaltyCount: 0 },
);
assert.deepEqual(
  calculateAgentMonthlySummary(
    [{ finalValue: 1, state: "workday" }, { finalValue: 0, state: "empty" }],
    { name: "Supervisor", role: "svr" },
    rules,
  ),
  { workDays: 1, lowPhotoDays: 0, specialDays: 0, penaltyCount: 0 },
);

assert.equal(getDailyAttendanceValue({ photoCount: 19, salesAmount: 1200000 }, rules), "19s");
assert.equal(validateManualValue("18k", rules).ok, false);
assert.equal(validateManualValue("18b", rules).ok, false);
assert.equal(validateManualValue("18\u043a", rules).ok, false);
for (const value of ["15s", "16s", "17s", "18s", "19s"]) {
  assert.equal(validateManualValue(value, rules).ok, true);
  assert.equal(calculateAgentMonthlySummary([{ finalValue: value, state: "special" }], { name: "Agent" }, rules).specialDays, 1);
}
assert.equal(plannedWorkDaysFor({ plannedWorkDays: { "2026-07": { sof: 27 } } }, "2026-07", "sof"), 27);

const validation = validateAttendanceData({
  employees: [{ id: "emp_ali", name: "Ali" }],
  routes: [{ agentCode: "JY001", brandId: "sof" }],
  assignments: [{ agentCode: "JY001", employeeId: "emp_ali", startDate: "2026-06-01", endDate: null }],
  settings: DEFAULT_SETTINGS,
});
assert.equal(validation.ok, true);

const baseStore = {
  employees: [
    { id: "emp_ali", name: "Ali", role: "agent", active: true },
    { id: "emp_vali", name: "Vali", role: "agent", active: true },
  ],
  routes: [{ agentCode: "JY001", brandId: "sof" }],
  assignments: [{ agentCode: "JY001", employeeId: "emp_ali", startDate: "2026-06-01", endDate: null }],
  settings: DEFAULT_SETTINGS,
};

const replacedExisting = prepareReplaceEmployee(baseStore, {
  agentCode: "JY001",
  oldEmployeeEndDate: "2026-06-04",
  newStartDate: "2026-06-05",
  newEmployeeId: "emp_vali",
  reason: "Yangi xodim olindi",
  brandId: "sof",
});
assert.equal(replacedExisting.closedAssignment.endDate, "2026-06-04");
assert.equal(replacedExisting.assignment.employeeId, "emp_vali");
assert.equal(replacedExisting.store.employees.length, 2);
assert.equal(replacedExisting.store.employees.find((e) => e.id === "emp_ali").active, false);

const replacedNew = prepareReplaceEmployee(
  {
    employees: [{ id: "emp_vali_karimov", name: "Old Vali", role: "agent", active: true }],
    routes: [],
    assignments: [],
    settings: DEFAULT_SETTINGS,
  },
  {
    agentCode: "JY002",
    oldEmployeeEndDate: "2026-06-04",
    newStartDate: "2026-06-05",
    newEmployee: { name: "Vali Karimov", phone: "+998", role: "agent", notes: "test" },
    reason: "Yangi",
    brandId: "sof",
  },
);
assert.equal(replacedNew.route.agentCode, "JY002");
assert.equal(replacedNew.employee.id, "emp_vali_karimov_2");

assert.throws(
  () => prepareReplaceEmployee(baseStore, {
    agentCode: "JY001",
    oldEmployeeEndDate: "2026-06-04",
    newStartDate: "2026-06-04",
    newEmployeeId: "emp_vali",
  }),
  /keyin/,
);

assert.throws(
  () => prepareReplaceEmployee({
    employees: [{ id: "emp_ali", name: "Ali", role: "agent", active: true }, { id: "emp_vali", name: "Vali", role: "agent", active: true }],
    routes: [{ agentCode: "JY001", brandId: "sof" }],
    assignments: [
      { agentCode: "JY001", employeeId: "emp_ali", startDate: "2026-06-01", endDate: null },
      { agentCode: "JY001", employeeId: "emp_vali", startDate: "2026-06-06", endDate: null },
    ],
    settings: DEFAULT_SETTINGS,
  }, {
    agentCode: "JY001",
    oldEmployeeEndDate: "2026-06-04",
    newStartDate: "2026-06-05",
    newEmployeeId: "emp_vali",
  }),
  /overlap/,
);

assert.throws(
  () => prepareReplaceEmployee({
    employees: [{ id: "emp_ali", name: "Ali", role: "agent", active: true }, { id: "emp_vali", name: "Vali", role: "agent", active: true }],
    routes: [{ agentCode: "JY001", brandId: "sof" }, { agentCode: "JY009", brandId: "sof" }],
    assignments: [
      { agentCode: "JY001", employeeId: "emp_ali", startDate: "2026-06-01", endDate: null },
      { agentCode: "JY009", employeeId: "emp_vali", startDate: "2026-06-01", endDate: null },
    ],
    settings: DEFAULT_SETTINGS,
  }, {
    agentCode: "JY001",
    oldEmployeeEndDate: "2026-06-04",
    newStartDate: "2026-06-05",
    newEmployeeId: "emp_vali",
  }),
  /boshqa agent/,
);

await mkdir(join(testRoot, "outputs"), { recursive: true });
const raw = async (date, agents, attendanceTeams = [], attendanceTeamsMeta) => writeFile(
  join(testRoot, "outputs", `sof_browser_collect_${date}_raw.json`),
  `${JSON.stringify({
    date,
    brand: { id: "sof", name: "SOF" },
    attendanceTeams,
    ...(attendanceTeamsMeta ? { attendanceTeamsMeta } : {}),
    agents,
  }, null, 2)}\n`,
  "utf8",
);
await raw(
  "2099-07-01",
  [{ code: "JY001", name: "JY001 [ALI TEST]", tt: 21 }],
  [{
    supervisorId: "sales-svr-1",
    supervisorCode: "SVR001",
    supervisorName: "SVR001 [SUPERVISOR TEST]",
    region: "Toshkent",
    agentCodes: ["JY001"],
    brandId: "sof",
    source: "sales",
  }],
);
await raw("2099-07-02", [{ code: "JY001", name: "JY001 [ALI TEST]", tt: 22 }]);
await raw("2099-07-03", [{ code: "JY001", name: "JY001 [ALI TEST]", tt: 18 }]);
await raw("2099-07-04", []);

await safeWriteJson(FILES.employees, { employees: [{ id: "emp_ali_test", name: "ALI TEST", role: "agent", active: false, hireDate: "2099-07-02", leftDate: "2099-07-05", region: "Chilonzor" }] });
await safeWriteJson(FILES.routes, { routes: [{ id: "route_jy001", agentCode: "JY001", brandId: "sof", role: "agent", active: true, region: "Chilonzor" }] });
await safeWriteJson(FILES.assignments, { assignments: [{ id: "assign_jy001", agentCode: "JY001", employeeId: "emp_ali_test", startDate: "2099-07-01", endDate: "2099-07-31", brandId: "sof" }] });
await safeWriteJson(FILES.settings, { ...DEFAULT_SETTINGS, plannedWorkDays: { "2099-07": { sof: 27 } } });

let generated = await generateAttendanceMonth({ month: "2099-07", brandId: "sof" });
let generatedRow = generated.rows.find((row) => row.agentCode === "JY001");
assert.equal(generatedRow.region, "Chilonzor");
assert.equal(generatedRow.days[0].state, "not_applicable");
assert.equal(generatedRow.days[1].state, "workday");
assert.equal(generatedRow.days[2].state, "low");
assert.equal(generatedRow.days[3].state, "zero_activity");
assert.equal(generatedRow.days[4].state, "missing_dataset");
assert.equal(generatedRow.days[5].state, "not_applicable");
assert.equal(generated.plannedWorkDays, 27);
assert.equal(existsSync(join(testRoot, "data", "attendance", "months", "2099-07-sof.json")), true);
const supervisorRow = generated.rows.find((row) => row.agentCode === "SVR001");
assert.equal(supervisorRow.role, "svr");
assert.equal(supervisorRow.region, "Toshkent");
assert.equal(supervisorRow.days[0].finalValue, 1);
assert.equal(supervisorRow.summary.workDays, 3);
assert.equal(supervisorRow.summary.lowPhotoDays, 0);
assert.equal(generated.dataQuality.supervisorSourceDate, "2099-07-01");
assert.equal(generated.dataQuality.activeSupervisors, 1);

await raw(
  "2099-07-05",
  [{ code: "JY001", name: "JY001 [ALI TEST]", tt: 23 }],
  [],
  {
    status: "ok",
    authoritative: true,
    fetchedAt: new Date().toISOString(),
    sourceCount: 0,
    activeSourceCount: 0,
    teamCount: 0,
    conflicts: [],
  },
);
generated = await generateAttendanceMonth({ month: "2099-07", brandId: "sof" });
assert.equal(generated.rows.some((row) => row.agentCode === "SVR001"), false);
assert.equal(generated.dataQuality.supervisorSourceDate, "2099-07-05");
assert.equal(generated.dataQuality.deactivatedSupervisors, 1);
const routesAfterSupervisorCleanup = JSON.parse(await readFile(FILES.routes, "utf8")).routes;
assert.equal(routesAfterSupervisorCleanup.find((route) => route.agentCode === "SVR001").active, false);

await saveOverride({ date: "2099-07-04", agentCode: "JY001", employeeId: "emp_ali_test", brandId: "sof", manualValue: "15s", reason: "Sababli kun", updatedBy: "test" });
generated = await generateAttendanceMonth({ month: "2099-07", brandId: "sof" });
generatedRow = generated.rows.find((row) => row.agentCode === "JY001");
assert.equal(generatedRow.days[3].state, "special");
assert.equal(generatedRow.days[3].source, "manual");
assert.equal((await attendanceHistory({ agentCode: "JY001", date: "2099-07-04", brandId: "sof" })).length, 1);

await resetOverride({ date: "2099-07-04", agentCode: "JY001", employeeId: "emp_ali_test", brandId: "sof", updatedBy: "test" });
await bulkSaveOverrides({ agentCode: "JY001", employeeId: "emp_ali_test", brandId: "sof", startDate: "2099-07-02", endDate: "2099-07-03", manualValue: "16s", reason: "Tasdiqlangan", updatedBy: "test" });
generated = await generateAttendanceMonth({ month: "2099-07", brandId: "sof" });
assert.equal(generated.rows.find((row) => row.agentCode === "JY001").days[1].finalValue, "16s");
assert.ok(attendanceIssuesFromMonth(generated).some((item) => item.type === "manual"));
const missingDatasetIssues = attendanceIssuesFromMonth(generated).filter((item) => item.type === "missing_dataset");
const missingDatasetDates = new Set(
  generated.rows.flatMap((row) => row.days.filter((day) => day.state === "missing_dataset").map((day) => day.date)),
);
assert.equal(missingDatasetIssues.length, missingDatasetDates.size);
assert.ok(missingDatasetIssues.every((item) => item.scope === "date" && item.affectedRows > 0));

await setAttendanceMonthStatus({ month: "2099-07", brandId: "sof", status: "approved", updatedBy: "test" });
await setAttendanceMonthStatus({ month: "2099-07", brandId: "sof", status: "locked", updatedBy: "test" });
await assert.rejects(
  saveOverride({ date: "2099-07-02", agentCode: "JY001", employeeId: "emp_ali_test", brandId: "sof", manualValue: "20", reason: "test" }),
  /yopilgan/i,
);
assert.equal((await loadAttendanceMonth({ month: "2099-07", brandId: "sof" })).monthStatus.status, "locked");

const doubleAssignment = validateAttendanceData({
  employees: [{ id: "emp_one", name: "One" }],
  routes: [{ agentCode: "JY001" }, { agentCode: "JY002" }],
  assignments: [
    { agentCode: "JY001", employeeId: "emp_one", startDate: "2099-07-01", endDate: null },
    { agentCode: "JY002", employeeId: "emp_one", startDate: "2099-07-01", endDate: null },
  ],
  settings: DEFAULT_SETTINGS,
});
assert.equal(doubleAssignment.ok, false);
assert.ok(doubleAssignment.errors.some((item) => item.includes("ikki agent") || item.includes("bir vaqtning")));

await rm(testRoot, { recursive: true, force: true });
console.log("Attendance tests OK");

import assert from "node:assert/strict";
import {
  DEFAULT_SETTINGS,
  calculateAgentMonthlySummary,
  findAssignmentForDate,
  getDailyAttendanceValue,
  prepareReplaceEmployee,
  validateAttendanceData,
  validateManualValue,
} from "./attendance-core.mjs";

const rules = DEFAULT_SETTINGS.attendanceRules;

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

assert.equal(getDailyAttendanceValue({ photoCount: 19, salesAmount: 1200000 }, rules), "19s");
assert.equal(validateManualValue("18k", rules).ok, false);
assert.equal(validateManualValue("18b", rules).ok, false);
assert.equal(validateManualValue("18\u043a", rules).ok, false);

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

console.log("Attendance tests OK");

import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { findBrand, loadBrandsConfig, publicBrand } from "./brand-config.mjs";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Railway'da tabel ma'lumotlari Volume'da; lokalda ROOT bilan bir xil.
const DATA_ROOT = process.env.DATA_DIR ? resolve(process.env.DATA_DIR) : ROOT;
export const OUTPUTS_DIR = join(DATA_ROOT, "outputs");
export const ATT_DIR = join(DATA_ROOT, "data", "attendance");
export const ATT_BACKUP_DIR = join(ATT_DIR, "backups");
export const ATT_MONTHS_DIR = join(ATT_DIR, "months");
export const ATT_OVERRIDES_DIR = join(ATT_DIR, "overrides");

export const FILES = {
  employees: join(ATT_DIR, "employees.json"),
  routes: join(ATT_DIR, "routes.json"),
  assignments: join(ATT_DIR, "assignments.json"),
  settings: join(ATT_DIR, "settings.json"),
  auditLog: join(ATT_DIR, "audit-log.json"),
};

export const DEFAULT_SETTINGS = {
  attendanceRules: {
    minPhotoForWorkDay: 20,
    specialPhotoCount: 19,
    specialSalesThreshold: 1000000,
    specialMarker: "s",
    penaltyEveryLowPhotoDays: 3,
    vacantName: "Vacant",
    excludedCodes: ["FD", "RM"],
    supervisorRoles: ["svr"],
    countEmptyWorkDayAsLowPhoto: false,
  },
  teams: [],
};

const EMPTY_FILES = {
  employees: { employees: [] },
  routes: { routes: [] },
  assignments: { assignments: [] },
  settings: DEFAULT_SETTINGS,
  auditLog: { items: [] },
};

function stamp() {
  return new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return structuredClone(fallback);
  }
}

export async function ensureAttendanceFiles() {
  await mkdir(ATT_DIR, { recursive: true });
  await mkdir(ATT_BACKUP_DIR, { recursive: true });
  await mkdir(ATT_MONTHS_DIR, { recursive: true });
  await mkdir(ATT_OVERRIDES_DIR, { recursive: true });
  for (const [key, path] of Object.entries(FILES)) {
    if (!existsSync(path)) {
      await writeFile(path, `${JSON.stringify(EMPTY_FILES[key], null, 2)}\n`, "utf8");
    }
  }
}

export async function safeWriteJson(path, data, label = "") {
  await mkdir(dirname(path), { recursive: true });
  await mkdir(ATT_BACKUP_DIR, { recursive: true });
  if (existsSync(path)) {
    const name = label || path.split(/[\\/]/).pop().replace(/\.json$/i, "");
    await copyFile(path, join(ATT_BACKUP_DIR, `${name}-${stamp()}.json`));
  }
  const tempPath = `${path}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(tempPath, path);
}

export async function loadAttendanceStore() {
  await ensureAttendanceFiles();
  return {
    employees: (await readJson(FILES.employees, EMPTY_FILES.employees)).employees || [],
    routes: (await readJson(FILES.routes, EMPTY_FILES.routes)).routes || [],
    assignments: (await readJson(FILES.assignments, EMPTY_FILES.assignments)).assignments || [],
    settings: await readJson(FILES.settings, EMPTY_FILES.settings),
    auditLog: (await readJson(FILES.auditLog, EMPTY_FILES.auditLog)).items || [],
  };
}

export function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}

export function normalizeMonth(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})$/);
  if (!match) throw new Error("Oy formati noto'g'ri. Masalan: 2026-06");
  return `${match[1]}-${match[2]}`;
}

export function daysInMonth(month) {
  const [year, mm] = normalizeMonth(month).split("-").map(Number);
  return new Date(year, mm, 0).getDate();
}

export function monthDate(month, day) {
  return `${month}-${String(day).padStart(2, "0")}`;
}

function parseDate(value) {
  return value ? new Date(`${String(value).slice(0, 10)}T00:00:00`) : null;
}

function httpError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function isIsoDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function addDaysIso(date, days) {
  if (!isIsoDate(date)) return "";
  const next = parseDate(date);
  next.setDate(next.getDate() + days);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
}

export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  const startA = parseDate(aStart);
  const endA = parseDate(aEnd) || new Date("9999-12-31T00:00:00");
  const startB = parseDate(bStart);
  const endB = parseDate(bEnd) || new Date("9999-12-31T00:00:00");
  return startA <= endB && startB <= endA;
}

export function findAssignmentForDate(agentCode, date, assignments) {
  const code = normalizeCode(agentCode);
  const d = parseDate(date);
  return (assignments || []).find((assignment) => {
    if (normalizeCode(assignment.agentCode) !== code) return false;
    const start = parseDate(assignment.startDate);
    const end = parseDate(assignment.endDate);
    if (!start || d < start) return false;
    if (end && d > end) return false;
    return true;
  }) || null;
}

export function getDailyAttendanceValue(activity, rules) {
  if (!activity) return "";
  const photoCount = Number(activity.photoCount || 0);
  const salesAmount = Number(activity.salesAmount || 0);
  if (
    photoCount === Number(rules.specialPhotoCount)
    && salesAmount > Number(rules.specialSalesThreshold)
  ) {
    return `${photoCount}${rules.specialMarker}`;
  }
  return photoCount;
}

export function valueState(value, employee, rules) {
  const text = String(value ?? "").trim().toLowerCase();
  const marker = String(rules.specialMarker || "s").toLowerCase();
  if (isVacantEmployee(employee, rules)) return "vacant";
  if (!text) return "empty";
  if (text === "1" && String(employee?.role || "").toLowerCase() === "svr") return "workday";
  if (text === "0" && String(employee?.role || "").toLowerCase() === "svr") return "empty";
  if (text.includes(marker)) return "special";
  const numericValue = Number(text);
  if (Number.isNaN(numericValue)) return "empty";
  return numericValue >= Number(rules.minPhotoForWorkDay) ? "workday" : "low";
}

function isVacantEmployee(employee, rules) {
  const vacantName = String(rules?.vacantName || "vacant").trim().toLowerCase();
  const name = String(employee?.name || employee?.employeeName || "").trim().toLowerCase();
  const id = String(employee?.id || employee?.employeeId || "").trim().toLowerCase();
  return Boolean(
    employee?.isVacant
    || (vacantName && name === vacantName)
    || name === "vacant"
    || name === "vakant"
    || id === "emp_vacant"
  );
}

export function calculateAgentMonthlySummary(days, employee, rules) {
  if (isVacantEmployee(employee, rules)) {
    return { workDays: 0, lowPhotoDays: 0, specialDays: 0, penaltyCount: 0 };
  }
  let workDays = 0;
  let lowPhotoDays = 0;
  let specialDays = 0;
  const marker = String(rules.specialMarker || "s").toLowerCase();
  for (const day of days) {
    const value = String(day.finalValue ?? day.manualValue ?? day.autoValue ?? "").trim().toLowerCase();
    if (!value) continue;
    if (/[kbк]/i.test(value)) continue;
    if (value.includes(marker)) {
      specialDays += 1;
      workDays += 1;
      continue;
    }
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) continue;
    if (numericValue >= Number(rules.minPhotoForWorkDay)) workDays += 1;
    else if (numericValue >= 0 && numericValue < Number(rules.minPhotoForWorkDay)) lowPhotoDays += 1;
  }
  return {
    workDays,
    lowPhotoDays,
    specialDays,
    penaltyCount: Math.floor(lowPhotoDays / Number(rules.penaltyEveryLowPhotoDays || 3)),
  };
}

export function validateManualValue(value, rules) {
  const text = String(value ?? "").trim();
  if (!text) return { ok: true };
  if (/[kbк]/i.test(text)) return { ok: false, error: "K/b markerlari yangi tabel tizimida ishlatilmaydi" };
  const special = new RegExp(`^\\d+${String(rules.specialMarker || "s")}$`, "i");
  if (special.test(text)) return { ok: true };
  if (/^\d+$/.test(text)) return { ok: true };
  return { ok: false, error: "Qiymat faqat son, bo'sh yoki 19s kabi sababli marker bo'lishi mumkin" };
}

export async function resolveBrand(value) {
  const config = await loadBrandsConfig({ includeDisabled: true });
  const brand = findBrand(config, value || "lalaku_mama", { includeDisabled: true });
  if (!brand) throw new Error(`Brend topilmadi: ${value}`);
  return publicBrand(brand);
}

function isBrandDataset(data, brand) {
  if (!brand) return true;
  const raw = data?.brand || {};
  const candidates = [raw.id, raw.name, raw.code, raw.filePrefix].filter(Boolean);
  return candidates.some((value) => {
    const v = String(value).toLowerCase();
    return v === brand.id || v === brand.name.toLowerCase() || (brand.agentPrefixes || []).some((p) => v === p.toLowerCase());
  }) || (data?.agents || []).some((agent) => (brand.agentPrefixes || []).some((prefix) => normalizeCode(agent.code).startsWith(prefix)));
}

function numericAmount(value) {
  if (typeof value === "number") return value;
  if (value && typeof value === "object") return numericAmount(value.amount);
  return Number(String(value || "").replace(/[^\d.-]/g, "")) || 0;
}

function activityFromAgent(date, agent) {
  const api = agent.apiRow || {};
  const photoCount = Number(
    api.uploaded_photo_report_count
    ?? api.photo_report_uploaded_client_count
    ?? agent.uploaded_photo_report_count
    ?? agent.tt
    ?? agent.expectedPhotos
    ?? agent.urls?.length
    ?? 0
  ) || 0;
  const clientsSum = Array.isArray(agent.clients)
    ? agent.clients.reduce((sum, client) => sum + numericAmount(client.orderSum), 0)
    : 0;
  const salesAmount = numericAmount(agent.orderSum)
    || numericAmount(api.total_order_amount)
    || clientsSum;
  return {
    date,
    agentCode: normalizeCode(agent.code || api.agent_code),
    agentName: String(agent.name || agent.agent || api.agent?.name || "").trim(),
    photoCount,
    salesAmount,
  };
}

export async function loadActivitiesFromOutputs(month, brand) {
  const activities = new Map();
  const files = await import("node:fs/promises").then((fs) => fs.readdir(OUTPUTS_DIR));
  for (const file of files) {
    if (!file.endsWith("_raw.json") || !file.includes(month)) continue;
    const data = JSON.parse(await readFile(join(OUTPUTS_DIR, file), "utf8"));
    const date = String(data.date || file.match(/\d{4}-\d{2}-\d{2}/)?.[0] || "");
    if (!date.startsWith(month) || !isBrandDataset(data, brand)) continue;
    for (const agent of data.agents || []) {
      const activity = activityFromAgent(date, agent);
      if (!activity.agentCode) continue;
      activities.set(`${activity.agentCode}#${date}`, activity);
    }
  }
  return activities;
}

function isExcludedCode(code, rules) {
  const upper = normalizeCode(code);
  return (rules.excludedCodes || []).some((prefix) => upper.startsWith(normalizeCode(prefix)));
}

function routeIdFromCode(code) {
  return `route_${normalizeCode(code).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`;
}

function cleanEmployeeName(rawName, agentCode = "") {
  const raw = String(rawName || "").replace(/\s+/g, " ").trim();
  if (!raw) return "";
  const bracket = raw.match(/\[([^\]]+)\]/);
  if (bracket?.[1]) return bracket[1].replace(/\s+/g, " ").trim();
  const code = normalizeCode(agentCode);
  return raw
    .replace(new RegExp(`^${code}\\b`, "i"), "")
    .replace(/\b\d{1,2}[.-]\d{1,2}([.-]\d{2,4})?\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function employeeNameKey(name) {
  return String(name || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function employeeForName(name, employees = []) {
  const key = employeeNameKey(name);
  return employees.find((employee) => employeeNameKey(employee.name) === key) || null;
}

function createAssignmentId(agentCode, startDate) {
  return `assign_${normalizeCode(agentCode).toLowerCase()}_${String(startDate).replaceAll("-", "")}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function syncEmployeesFromActivities(store, activities, month, brand) {
  const monthStart = monthDate(month, 1);
  let employeesChanged = false;
  let assignmentsChanged = false;
  const profiles = new Map();
  for (const activity of activities.values()) {
    const code = normalizeCode(activity.agentCode);
    if (!code || profiles.has(code)) continue;
    const name = cleanEmployeeName(activity.agentName, code);
    if (!name) continue;
    profiles.set(code, name);
  }

  for (const [agentCode, employeeName] of profiles) {
    let employee = employeeForName(employeeName, store.employees);
    if (!employee) {
      employee = {
        id: employeeIdFromName(employeeName, store.employees),
        name: employeeName,
        phone: "",
        role: "agent",
        active: true,
        notes: "Sales outputdan avtomatik qo'shildi",
      };
      store.employees.push(employee);
      employeesChanged = true;
    } else if (!employee.active) {
      employee.active = true;
      employeesChanged = true;
    }

    const route = routeForCode(agentCode, store.routes);
    if (route && !route.role) route.role = employee.role || "agent";

    const existing = store.assignments
      .filter((assignment) => normalizeCode(assignment.agentCode) === agentCode)
      .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)));
    if (existing.some((assignment) => findAssignmentForDate(agentCode, monthStart, [assignment]))) continue;

    const firstAssignment = existing[0] || null;
    const endDate = firstAssignment && parseDate(firstAssignment.startDate) > parseDate(monthStart)
      ? addDaysIso(firstAssignment.startDate, -1)
      : null;
    if (endDate && parseDate(endDate) < parseDate(monthStart)) continue;

    store.assignments.push({
      id: createAssignmentId(agentCode, monthStart),
      agentCode,
      employeeId: employee.id,
      startDate: monthStart,
      endDate,
      reason: "Sales outputdan avtomatik import",
      brandId: brand?.id || route?.brandId || "",
    });
    assignmentsChanged = true;
  }
  return { employeesChanged, assignmentsChanged };
}

function rowKey(agentCode, employeeId, startDate, endDate) {
  return `${normalizeCode(agentCode)}#${employeeId || "vacant"}#${startDate || ""}#${endDate || ""}`;
}

function vacantRowKey(agentCode, month) {
  return `${normalizeCode(agentCode)}#vacant#${month}`;
}

function employeeForAssignment(assignment, employees) {
  return employees.find((employee) => employee.id === assignment?.employeeId) || null;
}

function routeForCode(agentCode, routes) {
  return routes.find((route) => normalizeCode(route.agentCode) === normalizeCode(agentCode)) || null;
}

function rowForDay(rows, key, base) {
  if (!rows.has(key)) rows.set(key, { ...base, days: [] });
  return rows.get(key);
}

function buildSupervisorValue(agentCode, date, settings, activities) {
  const team = (settings.teams || []).find((item) => normalizeCode(item.supervisorCode) === normalizeCode(agentCode));
  if (!team) return "";
  return (team.agentCodes || []).some((code) => activities.has(`${normalizeCode(code)}#${date}`)) ? 1 : 0;
}

function buildAttendanceIndexes(store) {
  const employeesById = new Map((store.employees || []).map((employee) => [employee.id, employee]));
  const routesByCode = new Map((store.routes || []).map((route) => [normalizeCode(route.agentCode), route]));
  const assignmentsByCode = new Map();
  for (const assignment of store.assignments || []) {
    const code = normalizeCode(assignment.agentCode);
    const list = assignmentsByCode.get(code) || [];
    list.push(assignment);
    assignmentsByCode.set(code, list);
  }
  for (const list of assignmentsByCode.values()) {
    list.sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)));
  }
  return { employeesById, routesByCode, assignmentsByCode };
}

function findAssignmentInIndex(agentCode, date, assignmentsByCode) {
  const list = assignmentsByCode.get(normalizeCode(agentCode)) || [];
  return list.find((assignment) => findAssignmentForDate(agentCode, date, [assignment])) || null;
}

function stateForMissingDay(row) {
  if (row.isVacant || row.routeStatus === "vacant") return "vacant";
  if (row.routeStatus === "unknown_route") return "unknown_route";
  return "empty";
}

function ensureStableRowDays(row, month, dayCount) {
  const byDay = new Map((row.days || []).map((day) => [Number(day.day), day]));
  row.days = Array.from({ length: dayCount }, (_, index) => {
    const day = index + 1;
    return byDay.get(day) || {
      date: monthDate(month, day),
      day,
      autoValue: "",
      finalValue: "",
      photoCount: null,
      salesAmount: 0,
      state: stateForMissingDay(row),
    };
  });
  return row;
}

function assignmentOverlaps(assignments = []) {
  const overlaps = [];
  const byCode = new Map();
  for (const assignment of assignments) {
    const code = normalizeCode(assignment.agentCode);
    const list = byCode.get(code) || [];
    list.push(assignment);
    byCode.set(code, list);
  }
  for (const [code, list] of byCode) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        if (rangesOverlap(list[i].startDate, list[i].endDate, list[j].startDate, list[j].endDate)) {
          overlaps.push({
            agentCode: code,
            first: list[i].id || `${list[i].startDate}-${list[i].endDate || "open"}`,
            second: list[j].id || `${list[j].startDate}-${list[j].endDate || "open"}`,
          });
        }
      }
    }
  }
  return overlaps;
}

export function attendanceSummaryTotals(monthData) {
  const rows = monthData?.rows || [];
  return rows.reduce((totals, row) => {
    totals.rows += 1;
    if (row.routeStatus === "assigned") totals.assignedRows += 1;
    else if (row.routeStatus === "vacant") totals.vacantRows += 1;
    else if (row.routeStatus === "unknown_route") totals.unknownRows += 1;
    totals.workDays += Number(row.summary?.workDays || 0);
    totals.lowPhotoDays += Number(row.summary?.lowPhotoDays || 0);
    totals.specialDays += Number(row.summary?.specialDays || 0);
    totals.penaltyCount += Number(row.summary?.penaltyCount || 0);
    return totals;
  }, {
    rows: 0,
    assignedRows: 0,
    vacantRows: 0,
    unknownRows: 0,
    workDays: 0,
    lowPhotoDays: 0,
    specialDays: 0,
    penaltyCount: 0,
  });
}

export async function generateAttendanceMonth({ month, brandId }) {
  const normalizedMonth = normalizeMonth(month);
  const brand = brandId ? await resolveBrand(brandId) : null;
  const store = await loadAttendanceStore();
  const rules = store.settings.attendanceRules || DEFAULT_SETTINGS.attendanceRules;
  const activities = await loadActivitiesFromOutputs(normalizedMonth, brand);
  let routesChanged = false;
  if (brand) {
    for (const route of store.routes) {
      if (!route.role) {
        route.role = "agent";
        routesChanged = true;
      }
    }
    const knownRoutes = new Set(store.routes.map((route) => normalizeCode(route.agentCode)));
    for (const activity of activities.values()) {
      const code = normalizeCode(activity.agentCode);
      if (!code || knownRoutes.has(code) || isExcludedCode(code, rules)) continue;
      store.routes.push({
        id: routeIdFromCode(code),
        agentCode: code,
        brandId: brand.id,
        role: "agent",
        active: true,
        notes: "Sales outputdan avtomatik qo'shildi",
      });
      knownRoutes.add(code);
      routesChanged = true;
    }
    if (routesChanged) await safeWriteJson(FILES.routes, { routes: store.routes }, "routes");
  }
  const employeeSync = syncEmployeesFromActivities(store, activities, normalizedMonth, brand);
  if (employeeSync.employeesChanged) await safeWriteJson(FILES.employees, { employees: store.employees }, "employees");
  if (employeeSync.assignmentsChanged) await safeWriteJson(FILES.assignments, { assignments: store.assignments }, "assignments");
  const indexes = buildAttendanceIndexes(store);

  const routeCodes = store.routes
    .filter((route) => !brand || route.brandId === brand.id || (brand.agentPrefixes || []).some((prefix) => normalizeCode(route.agentCode).startsWith(prefix)))
    .map((route) => normalizeCode(route.agentCode));
  const activityCodes = [...new Set([...activities.values()].map((activity) => normalizeCode(activity.agentCode)))];
  const codes = [...new Set([...routeCodes, ...activityCodes])].filter((code) => !isExcludedCode(code, rules)).sort();
  const rows = new Map();
  const dayCount = daysInMonth(normalizedMonth);
  const rawDatesFound = [...new Set([...activities.values()].map((activity) => activity.date).filter(Boolean))].sort();
  const missingRoutes = [];

  for (const agentCode of codes) {
    const route = indexes.routesByCode.get(normalizeCode(agentCode)) || null;
    if (!route) missingRoutes.push(agentCode);
    for (let day = 1; day <= dayCount; day += 1) {
      const date = monthDate(normalizedMonth, day);
      const activity = activities.get(`${agentCode}#${date}`) || null;
      const assignment = findAssignmentInIndex(agentCode, date, indexes.assignmentsByCode);
      const employee = indexes.employeesById.get(assignment?.employeeId) || null;
      const role = employee?.role || (route ? "agent" : "unknown");
      const isSupervisor = (rules.supervisorRoles || []).includes(String(role).toLowerCase());
      const autoValue = isSupervisor
        ? buildSupervisorValue(agentCode, date, store.settings, activities)
        : getDailyAttendanceValue(activity, rules);
      const base = assignment
        ? {
          agentCode,
          employeeId: assignment.employeeId,
          employeeName: employee?.name || assignment.employeeId,
          role,
          brandId: route?.brandId || brand?.id || "",
          routeStatus: route ? "assigned" : "unknown_route",
          assignmentId: assignment.id,
          startDate: assignment.startDate,
          endDate: assignment.endDate || null,
          isVacant: false,
        }
        : route
          ? {
            agentCode,
            employeeId: null,
            employeeName: rules.vacantName || "Vacant",
            role: route.role || "agent",
            brandId: route.brandId || brand?.id || "",
            routeStatus: "vacant",
            assignmentId: null,
            startDate: date,
            endDate: date,
            isVacant: true,
          }
          : {
            agentCode,
            employeeId: null,
            employeeName: "Unknown route",
            role: "unknown",
            brandId: brand?.id || "",
            routeStatus: "unknown_route",
            assignmentId: null,
            startDate: date,
            endDate: date,
            isVacant: false,
          };
      const key = base.isVacant
        ? vacantRowKey(agentCode, normalizedMonth)
        : rowKey(agentCode, base.employeeId, assignment?.startDate || "unknown", assignment?.endDate || "");
      const row = rowForDay(rows, key, base);
      if (base.isVacant) {
        row.startDate = row.startDate && row.startDate < date ? row.startDate : date;
        row.endDate = row.endDate && row.endDate > date ? row.endDate : date;
      }
      row.days.push({
        date,
        day,
        autoValue,
        finalValue: autoValue,
        photoCount: activity?.photoCount ?? null,
        salesAmount: activity?.salesAmount ?? 0,
        state: valueState(autoValue, base, rules),
      });
    }
  }

  const overrides = await loadOverrides(normalizedMonth);
  for (const override of overrides) {
    const code = normalizeCode(override.agentCode);
    for (const row of rows.values()) {
      if (normalizeCode(row.agentCode) !== code) continue;
      if ((override.employeeId || null) !== (row.employeeId || null)) continue;
      const day = row.days.find((item) => item.date === override.date);
      if (!day) continue;
      day.manualValue = override.manualValue;
      day.finalValue = override.manualValue ?? day.autoValue;
      day.reason = override.reason || "";
      day.state = valueState(day.finalValue, row, rules);
    }
  }

  const outputRows = [...rows.values()].map((row) => {
    ensureStableRowDays(row, normalizedMonth, dayCount);
    const summary = calculateAgentMonthlySummary(row.days, row, rules);
    return { ...row, summary };
  }).sort((a, b) => `${a.agentCode}${a.startDate}`.localeCompare(`${b.agentCode}${b.startDate}`));

  const validation = validateAttendanceData(store);
  const dataQuality = {
    missingRoutes: [...new Set(missingRoutes)].sort(),
    overlappingAssignments: assignmentOverlaps(store.assignments),
    emptyTeamsWarning: Boolean(validation.warnings.some((warning) => warning.includes("SVR teamMap"))),
    rawDatesFound,
    generatedAt: new Date().toISOString(),
  };
  const result = {
    month: normalizedMonth,
    brandId: brand?.id || brandId || "",
    brand: brand || null,
    generatedAt: dataQuality.generatedAt,
    rules,
    rows: outputRows,
    validation,
    dataQuality,
  };
  result.summaryTotals = attendanceSummaryTotals(result);
  await safeWriteJson(join(ATT_MONTHS_DIR, `${normalizedMonth}.json`), result, `${normalizedMonth}`);
  return result;
}

export async function loadAttendanceMonth({ month, brandId, generateIfMissing = true }) {
  const normalizedMonth = normalizeMonth(month);
  const path = join(ATT_MONTHS_DIR, `${normalizedMonth}.json`);
  if (!existsSync(path)) {
    if (!generateIfMissing) return null;
    return generateAttendanceMonth({ month: normalizedMonth, brandId });
  }
  const data = JSON.parse(await readFile(path, "utf8"));
  if (brandId && data.brandId !== brandId) return generateAttendanceMonth({ month: normalizedMonth, brandId });
  if (!data.summaryTotals) data.summaryTotals = attendanceSummaryTotals(data);
  if (!data.validation || !data.dataQuality) {
    const store = await loadAttendanceStore();
    const validation = validateAttendanceData(store);
    data.validation = data.validation || validation;
    data.dataQuality = data.dataQuality || {
      missingRoutes: [...new Set((data.rows || []).filter((row) => row.routeStatus === "unknown_route").map((row) => normalizeCode(row.agentCode)))].sort(),
      overlappingAssignments: assignmentOverlaps(store.assignments),
      emptyTeamsWarning: Boolean(validation.warnings.some((warning) => warning.includes("SVR teamMap"))),
      rawDatesFound: [],
      generatedAt: data.generatedAt || "",
    };
  }
  return data;
}

export async function loadOverrides(month) {
  const path = join(ATT_OVERRIDES_DIR, `${normalizeMonth(month)}.json`);
  return (await readJson(path, { overrides: [] })).overrides || [];
}

export async function saveOverride({ date, agentCode, employeeId = null, manualValue = "", reason = "", updatedBy = "local-user" }) {
  const month = normalizeMonth(String(date).slice(0, 7));
  const store = await loadAttendanceStore();
  const rules = store.settings.attendanceRules || DEFAULT_SETTINGS.attendanceRules;
  const validation = validateManualValue(manualValue, rules);
  if (!validation.ok) {
    const error = new Error(validation.error);
    error.status = 400;
    throw error;
  }
  const path = join(ATT_OVERRIDES_DIR, `${month}.json`);
  const overrides = await loadOverrides(month);
  const index = overrides.findIndex((item) => item.date === date && normalizeCode(item.agentCode) === normalizeCode(agentCode) && (item.employeeId || null) === (employeeId || null));
  const previous = index >= 0 ? overrides[index] : null;
  const next = {
    date,
    agentCode: normalizeCode(agentCode),
    employeeId: employeeId || null,
    manualValue: String(manualValue ?? "").trim(),
    reason: String(reason || "").trim(),
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  if (index >= 0) overrides[index] = next;
  else overrides.push(next);
  const audit = await readJson(FILES.auditLog, EMPTY_FILES.auditLog);
  audit.items = audit.items || [];
  audit.items.push({
    changedAt: next.updatedAt,
    type: "attendance_override",
    agentCode: next.agentCode,
    employeeId: next.employeeId,
    date,
    oldValue: previous?.manualValue ?? "",
    newValue: next.manualValue,
    reason: next.reason,
  });
  await safeWriteJson(path, { overrides }, `overrides-${month}`);
  await safeWriteJson(FILES.auditLog, audit, "audit-log");
  return next;
}

function employeeIdFromName(name, employees = []) {
  const base = `emp_${String(name || "employee").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "employee"}`;
  const ids = new Set((employees || []).map((employee) => employee.id));
  if (!ids.has(base)) return base;
  for (let i = 2; i < 10000; i += 1) {
    const candidate = `${base}_${i}`;
    if (!ids.has(candidate)) return candidate;
  }
  return `${base}_${Date.now()}`;
}

function normalizeReplacementPayload(payload = {}) {
  const newEmployee = payload.newEmployee && typeof payload.newEmployee === "object" ? payload.newEmployee : {};
  return {
    agentCode: normalizeCode(payload.agentCode),
    oldEmployeeEndDate: String(payload.oldEmployeeEndDate || "").trim(),
    newStartDate: String(payload.newStartDate || "").trim(),
    reason: String(payload.reason || "").trim(),
    brandId: String(payload.brandId || "").trim(),
    newEmployeeId: String(payload.newEmployeeId || "").trim(),
    newEmployee: {
      name: String(newEmployee.name || payload.newEmployeeName || "").trim(),
      phone: String(newEmployee.phone || "").trim(),
      role: String(newEmployee.role || "agent").trim().toLowerCase() || "agent",
      notes: String(newEmployee.notes || "").trim(),
    },
  };
}

function otherActiveAssignmentForEmployee(assignments, employeeId, currentCode) {
  return (assignments || []).some((assignment) => (
    assignment.employeeId === employeeId
    && !assignment.endDate
    && normalizeCode(assignment.agentCode) !== normalizeCode(currentCode)
  ));
}

export function prepareReplaceEmployee(store, payload = {}) {
  const input = normalizeReplacementPayload(payload);
  if (!input.agentCode) throw httpError("Agent kodi kiritilmagan", 400);
  if (!isIsoDate(input.oldEmployeeEndDate)) throw httpError("Eski xodim oxirgi ish kuni noto'g'ri. Format: YYYY-MM-DD", 400);
  if (!isIsoDate(input.newStartDate)) throw httpError("Yangi xodim boshlanish sanasi noto'g'ri. Format: YYYY-MM-DD", 400);
  if (parseDate(input.newStartDate) <= parseDate(input.oldEmployeeEndDate)) {
    throw httpError("Yangi xodim boshlanish sanasi eski oxirgi kundan keyin bo'lishi kerak", 400);
  }
  if (!input.newEmployeeId && !input.newEmployee.name) {
    throw httpError("Mavjud xodim tanlang yoki yangi xodim ismini kiriting", 400);
  }

  const nextStore = {
    ...store,
    employees: structuredClone(store.employees || []),
    routes: structuredClone(store.routes || []),
    assignments: structuredClone(store.assignments || []),
    settings: structuredClone(store.settings || DEFAULT_SETTINGS),
  };
  const code = input.agentCode;
  let route = routeForCode(code, nextStore.routes);
  if (!route) {
    route = {
      id: `route_${code.toLowerCase()}`,
      agentCode: code,
      brandId: input.brandId,
      role: "agent",
      active: true,
      notes: "Xodim almashtirish vaqtida yaratilgan route",
    };
    nextStore.routes.push(route);
  }

  const active = nextStore.assignments.find((item) => normalizeCode(item.agentCode) === code && !item.endDate);
  if (active) active.endDate = input.oldEmployeeEndDate;
  let closedAssignment = active ? { ...active } : null;

  let employeeId = input.newEmployeeId;
  let employee = employeeId ? nextStore.employees.find((item) => item.id === employeeId) : null;
  if (employeeId && !employee) throw httpError(`Tanlangan xodim topilmadi: ${employeeId}`, 400);
  if (employeeId && otherActiveAssignmentForEmployee(nextStore.assignments, employeeId, code)) {
    throw httpError("Tanlangan xodim boshqa agent kodda active assignment bilan ishlayapti", 400);
  }
  if (!employee) {
    employeeId = employeeIdFromName(input.newEmployee.name, nextStore.employees);
    employee = {
      id: employeeId,
      name: input.newEmployee.name,
      phone: input.newEmployee.phone,
      role: input.newEmployee.role,
      active: true,
      notes: input.newEmployee.notes,
    };
    nextStore.employees.push(employee);
  } else {
    employee.active = true;
  }

  if (closedAssignment?.employeeId && !otherActiveAssignmentForEmployee(nextStore.assignments, closedAssignment.employeeId, code)) {
    const oldEmployee = nextStore.employees.find((item) => item.id === closedAssignment.employeeId);
    if (oldEmployee && oldEmployee.id !== employeeId) oldEmployee.active = false;
  }

  const nextAssignment = {
    id: `assign_${code.toLowerCase()}_${input.newStartDate.replaceAll("-", "")}_${Date.now()}`,
    agentCode: code,
    employeeId,
    startDate: input.newStartDate,
    endDate: null,
    reason: input.reason,
  };
  nextStore.assignments.push(nextAssignment);

  const validation = validateAttendanceData(nextStore);
  if (!validation.ok) throw httpError(validation.errors.join("; "), 400);
  return { store: nextStore, employee, assignment: nextAssignment, closedAssignment, route };
}

export async function replaceEmployee(payload = {}) {
  const store = await loadAttendanceStore();
  const result = prepareReplaceEmployee(store, payload);
  await safeWriteJson(FILES.employees, { employees: result.store.employees }, "employees");
  await safeWriteJson(FILES.routes, { routes: result.store.routes }, "routes");
  await safeWriteJson(FILES.assignments, { assignments: result.store.assignments }, "assignments");
  return {
    employee: result.employee,
    assignment: result.assignment,
    closedAssignment: result.closedAssignment,
    route: result.route,
  };
}

export function validateAttendanceData(store) {
  const errors = [];
  const warnings = [];
  const employees = store.employees || [];
  const routes = store.routes || [];
  const assignments = store.assignments || [];
  const employeeIds = new Set();
  const routeCodes = new Set();
  for (const employee of employees) {
    if (!employee.id) errors.push("Employee id bo'sh");
    if (employeeIds.has(employee.id)) errors.push(`Takrorlangan employee id: ${employee.id}`);
    employeeIds.add(employee.id);
  }
  for (const route of routes) {
    const code = normalizeCode(route.agentCode);
    if (!code) errors.push("Route agentCode bo'sh");
    if (routeCodes.has(code)) errors.push(`Takrorlangan route agentCode: ${code}`);
    routeCodes.add(code);
  }
  for (const assignment of assignments) {
    const code = normalizeCode(assignment.agentCode);
    if (!employeeIds.has(assignment.employeeId)) errors.push(`Assignment employee topilmadi: ${assignment.employeeId}`);
    if (!routeCodes.has(code)) errors.push(`Assignment route topilmadi: ${code}`);
    if (assignment.endDate && parseDate(assignment.startDate) > parseDate(assignment.endDate)) {
      errors.push(`${code}: startDate endDate'dan keyin`);
    }
  }
  const byCode = new Map();
  for (const assignment of assignments) {
    const code = normalizeCode(assignment.agentCode);
    const list = byCode.get(code) || [];
    list.push(assignment);
    byCode.set(code, list);
  }
  for (const [code, list] of byCode) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        if (rangesOverlap(list[i].startDate, list[i].endDate, list[j].startDate, list[j].endDate)) {
          errors.push(`${code}: assignment date range overlap`);
        }
      }
    }
  }

  const activeByEmployee = new Map();
  for (const assignment of assignments) {
    if (assignment.endDate) continue;
    const list = activeByEmployee.get(assignment.employeeId) || [];
    list.push(normalizeCode(assignment.agentCode));
    activeByEmployee.set(assignment.employeeId, list);
  }
  for (const [employeeId, codes] of activeByEmployee) {
    if (codes.length > 1) warnings.push(`${employeeId}: bir vaqtning o'zida ${codes.join(", ")} active assignment bor`);
  }

  const rules = store.settings?.attendanceRules || DEFAULT_SETTINGS.attendanceRules;
  const vacant = calculateAgentMonthlySummary([{ finalValue: 20 }], { isVacant: true, name: rules.vacantName }, rules);
  if (vacant.workDays || vacant.lowPhotoDays || vacant.penaltyCount) errors.push("Vacant hisobga kirmasligi kerak");
  const special = calculateAgentMonthlySummary([{ finalValue: "19s" }], { name: "A" }, rules);
  if (special.workDays !== 1 || special.specialDays !== 1) errors.push("19s ish kuni sifatida sanalmayapti");
  const low = calculateAgentMonthlySummary([{ finalValue: 18 }, { finalValue: 17 }, { finalValue: 0 }], { name: "A" }, rules);
  if (low.lowPhotoDays !== 3 || low.penaltyCount !== 1) errors.push("0-19 lowPhotoDays/shtraf noto'g'ri");
  const work = calculateAgentMonthlySummary([{ finalValue: 20 }, { finalValue: 25 }], { name: "A" }, rules);
  if (work.workDays !== 2) errors.push("20+ ish kuni sifatida sanalmayapti");
  if (validateManualValue("18k", rules).ok || validateManualValue("18b", rules).ok) errors.push("K/b markerlari invalid bo'lishi kerak");
  if (!(store.settings?.teams || []).length) warnings.push("SVR teamMap hali bo'sh: settings.json ichidagi teams orqali bog'lanadi");
  return { ok: errors.length === 0, errors, warnings };
}

export function attendanceToCsv(monthData) {
  const dayCount = daysInMonth(monthData.month);
  const headers = ["Kod", "Xodim", "Role", "Brend", ...Array.from({ length: dayCount }, (_, i) => String(i + 1)), "Foto kamligi", "Sababli", "Shtraf", "Ish kuni"];
  const rows = monthData.rows.map((row) => [
    row.agentCode,
    row.employeeName,
    row.role,
    row.brandId,
    ...Array.from({ length: dayCount }, (_, i) => {
      const day = row.days.find((item) => item.day === i + 1);
      return day?.finalValue ?? "";
    }),
    row.summary.lowPhotoDays,
    row.summary.specialDays,
    row.summary.penaltyCount,
    row.summary.workDays,
  ]);
  return [headers, ...rows].map((line) => line.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
}

export async function exportAttendanceCsv({ month, brandId }) {
  const data = await loadAttendanceMonth({ month, brandId });
  const suffix = brandId ? `-${brandId}` : "";
  const file = join(OUTPUTS_DIR, `attendance-${data.month}${suffix}.csv`);
  await writeFile(file, `\uFEFF${attendanceToCsv(data)}\n`, "utf8");
  return { file, data };
}

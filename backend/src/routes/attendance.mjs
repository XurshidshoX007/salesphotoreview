import { methodNotAllowed } from "../middleware/errors.mjs";

export function createAttendanceRoutes({ attendance, http }) {
  return async function routeAttendance({ req, res, parsed, access }) {
    if (!parsed.pathname.startsWith("/api/attendance/")) return false;
    if (parsed.pathname === "/api/attendance/config") {
      const store = await attendance.loadAttendanceStore();
      http.sendJson(res, 200, {
        ok: true,
        employees: store.employees,
        routes: store.routes,
        assignments: store.assignments,
        settings: store.settings,
        validation: attendance.validateAttendanceData(store),
      }, access.headers);
      return true;
    }
    if (parsed.pathname === "/api/attendance/month") {
      const data = await attendance.loadAttendanceMonth({ month: parsed.searchParams.get("month"), brandId: parsed.searchParams.get("brandId") || "" });
      http.sendJson(res, 200, { ok: true, ...data }, access.headers);
      return true;
    }
    if (parsed.pathname === "/api/attendance/day") {
      const data = await attendance.loadAttendanceDay({
        date: parsed.searchParams.get("date"),
        brandId: parsed.searchParams.get("brandId") || "",
      });
      http.sendJson(res, 200, { ok: true, ...data }, access.headers);
      return true;
    }
    if (parsed.pathname === "/api/attendance/issues") {
      const data = await attendance.loadAttendanceIssues({
        month: parsed.searchParams.get("month"),
        brandId: parsed.searchParams.get("brandId") || "",
        types: parsed.searchParams.get("types") || "",
      });
      http.sendJson(res, 200, { ok: true, ...data }, access.headers);
      return true;
    }
    if (parsed.pathname === "/api/attendance/history") {
      const items = await attendance.attendanceHistory({
        agentCode: parsed.searchParams.get("agentCode") || "",
        date: parsed.searchParams.get("date") || "",
        brandId: parsed.searchParams.get("brandId") || "",
        limit: parsed.searchParams.get("limit") || 50,
      });
      http.sendJson(res, 200, { ok: true, items }, access.headers);
      return true;
    }
    if (parsed.pathname === "/api/attendance/generate") {
      if (req.method !== "POST") return methodNotAllowed(res, http.sendJson, access.headers);
      const body = await http.readJsonBody(req, 1_000_000);
      const data = await attendance.generateAttendanceMonth({ month: body.month, brandId: body.brandId || "" });
      http.sendJson(res, 200, { ok: true, ...data }, access.headers);
      return true;
    }
    if (parsed.pathname === "/api/attendance/override") {
      if (req.method !== "POST") return methodNotAllowed(res, http.sendJson, access.headers);
      const body = await http.readJsonBody(req, 1_000_000);
      const override = await attendance.saveOverride(body);
      const data = await attendance.generateAttendanceMonth({ month: String(body.date || "").slice(0, 7), brandId: body.brandId || "" });
      http.sendJson(res, 200, {
        ok: true,
        override,
        changedCell: { date: override.date, agentCode: override.agentCode, employeeId: override.employeeId, manualValue: override.manualValue },
        summaryTotals: data.summaryTotals,
        month: data,
      }, access.headers);
      return true;
    }
    if (parsed.pathname === "/api/attendance/override/reset") {
      if (req.method !== "POST") return methodNotAllowed(res, http.sendJson, access.headers);
      const body = await http.readJsonBody(req, 1_000_000);
      const reset = await attendance.resetOverride(body);
      const data = await attendance.generateAttendanceMonth({ month: String(body.date || "").slice(0, 7), brandId: body.brandId || "" });
      http.sendJson(res, 200, { ok: true, reset, month: data, summaryTotals: data.summaryTotals }, access.headers);
      return true;
    }
    if (parsed.pathname === "/api/attendance/bulk-override") {
      if (req.method !== "POST") return methodNotAllowed(res, http.sendJson, access.headers);
      const body = await http.readJsonBody(req, 1_000_000);
      const changed = await attendance.bulkSaveOverrides(body);
      const data = await attendance.generateAttendanceMonth({ month: String(body.startDate || "").slice(0, 7), brandId: body.brandId || "" });
      http.sendJson(res, 200, { ok: true, changed, month: data, summaryTotals: data.summaryTotals }, access.headers);
      return true;
    }
    if (parsed.pathname === "/api/attendance/month-status") {
      if (req.method === "GET") {
        const item = await attendance.getAttendanceMonthStatus(parsed.searchParams.get("month"), parsed.searchParams.get("brandId") || "");
        http.sendJson(res, 200, { ok: true, item }, access.headers);
        return true;
      }
      if (req.method !== "POST") return methodNotAllowed(res, http.sendJson, access.headers);
      const item = await attendance.setAttendanceMonthStatus(await http.readJsonBody(req, 1_000_000));
      http.sendJson(res, 200, { ok: true, item }, access.headers);
      return true;
    }
    if (["/api/attendance/employees", "/api/attendance/routes", "/api/attendance/assignments"].includes(parsed.pathname)) {
      const store = await attendance.loadAttendanceStore();
      const key = parsed.pathname.split("/").pop();
      if (req.method === "GET") {
        http.sendJson(res, 200, { ok: true, [key]: store[key] }, access.headers);
        return true;
      }
      if (req.method !== "POST") return methodNotAllowed(res, http.sendJson, access.headers);
      const body = await http.readJsonBody(req, 1_000_000);
      const values = Array.isArray(body[key]) ? body[key] : [...store[key], body];
      const validation = attendance.validateAttendanceData({ ...store, [key]: values });
      if (!validation.ok) throw http.apiError(validation.errors.join("; "), 400);
      await attendance.safeWriteJson(attendance.ATT_FILES[key], { [key]: values }, key);
      http.sendJson(res, 200, { ok: true, [key]: values, validation }, access.headers);
      return true;
    }
    if (parsed.pathname === "/api/attendance/assignments/replace-employee") {
      if (req.method !== "POST") return methodNotAllowed(res, http.sendJson, access.headers);
      const result = await attendance.replaceEmployee(await http.readJsonBody(req, 1_000_000));
      http.sendJson(res, 200, { ok: true, ...result }, access.headers);
      return true;
    }
    if (parsed.pathname === "/api/attendance/export") {
      const brandId = parsed.searchParams.get("brandId") || "";
      const result = await attendance.exportAttendanceCsv({ month: parsed.searchParams.get("month"), brandId });
      const csv = attendance.attendanceToCsv(result.data);
      res.writeHead(200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="attendance-${result.data.month}${brandId ? `-${brandId}` : ""}.csv"`,
        "Cache-Control": "no-store",
        ...access.headers,
      });
      res.end(`\uFEFF${csv}\n`);
      return true;
    }
    return false;
  };
}

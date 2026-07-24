import { methodNotAllowed } from "../middleware/errors.mjs";

export function createCollectRoutes({ sales, http }) {
  return async function routeCollect({ req, res, parsed, access }) {
    if (!parsed.pathname.startsWith("/api/collect/")) return false;
    if (parsed.pathname === "/api/collect/status") {
      http.sendJson(res, 200, { ok: true, collect: sales.publicCollectState() }, access.headers);
      return true;
    }
    if (req.method !== "POST") return methodNotAllowed(res, http.sendJson, access.headers);
    if (parsed.pathname === "/api/collect/start") {
      const body = await http.readJsonBody(req);
      await sales.startCollectJob({
        date: body.date,
        brand: body.brand,
        browserHint: sales.isLocalHostHeader(req) ? body.browserHint : "",
      });
    } else if (parsed.pathname === "/api/collect/continue") {
      sales.collectContinue();
    } else if (parsed.pathname === "/api/collect/open-login") {
      sales.openSalesLoginHelper();
    } else if (parsed.pathname === "/api/collect/stop") {
      sales.stopCollectJob();
    } else {
      return false;
    }
    http.sendJson(res, 200, { ok: true, collect: sales.publicCollectState() }, access.headers);
    return true;
  };
}

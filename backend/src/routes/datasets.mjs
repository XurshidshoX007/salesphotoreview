import { methodNotAllowed } from "../middleware/errors.mjs";

export function createDatasetRoutes({ datasets, http }) {
  return async function routeDatasets({ req, res, parsed, access }) {
    if (!parsed.pathname.startsWith("/api/datasets/")) return false;
    try {
      let result;
      if (parsed.pathname === "/api/datasets/ensure") {
        if (req.method !== "POST") return methodNotAllowed(res, http.sendJson, access.headers);
        const body = await http.readJsonBody(req);
        result = await datasets.ensure({ date: body.date, brand: body.brand });
      } else if (parsed.pathname === "/api/datasets/status") {
        if (req.method !== "GET") return methodNotAllowed(res, http.sendJson, access.headers);
        result = await datasets.status({
          date: parsed.searchParams.get("date"),
          brand: parsed.searchParams.get("brand"),
        });
      } else {
        return false;
      }
      http.sendJson(res, 200, result, access.headers);
    } catch (error) {
      http.sendJson(res, Number(error?.status || 500), {
        ok: false,
        status: "error",
        code: error?.code || "UNKNOWN_ERROR",
        error: String(error?.message || "Noma'lum xato"),
      }, access.headers);
    }
    return true;
  };
}

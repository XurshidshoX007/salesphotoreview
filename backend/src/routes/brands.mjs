import { methodNotAllowed } from "../middleware/errors.mjs";

export function createBrandRoutes({ storage, http }) {
  return async function routeBrands({ req, res, parsed, access }) {
    if (parsed.pathname === "/api/brands") {
      if (req.method === "GET") {
        const config = await storage.loadBrandsConfig({ includeDisabled: true });
        http.sendJson(res, 200, { ok: true, ...config, revision: await storage.fileRevision(storage.BRANDS_FILE) }, access.headers);
        return true;
      }
      if (req.method === "POST") {
        const saved = await storage.saveBrandsConfig(await http.readJsonBody(req, 1_000_000));
        http.sendJson(res, 200, { ok: true, ...saved, revision: await storage.fileRevision(storage.BRANDS_FILE) }, access.headers);
        return true;
      }
      return methodNotAllowed(res, http.sendJson, access.headers);
    }
    if (parsed.pathname === "/api/brands/validate") {
      if (req.method !== "POST") return methodNotAllowed(res, http.sendJson, access.headers);
      const validation = storage.validateBrandsConfig(await http.readJsonBody(req, 1_000_000));
      http.sendJson(res, validation.ok ? 200 : 400, { ok: validation.ok, ...validation }, access.headers);
      return true;
    }
    if (!parsed.pathname.startsWith("/api/brands/")) return false;
    const id = decodeURIComponent(parsed.pathname.replace(/^\/api\/brands\//, "")).trim();
    const config = await storage.loadBrandsConfig({ includeDisabled: true });
    const index = config.brands.findIndex((brand) => brand.id === id);
    if (index < 0) throw http.apiError(`Brend topilmadi: ${id}`, 404);
    if (req.method === "PUT") {
      config.brands[index] = { ...config.brands[index], ...(await http.readJsonBody(req, 1_000_000)), id };
    } else if (req.method === "DELETE") {
      config.brands = config.brands.filter((brand) => brand.id !== id);
    } else {
      return methodNotAllowed(res, http.sendJson, access.headers);
    }
    const saved = await storage.saveBrandsConfig(config);
    http.sendJson(res, 200, { ok: true, ...saved, revision: await storage.fileRevision(storage.BRANDS_FILE) }, access.headers);
    return true;
  };
}

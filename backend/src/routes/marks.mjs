import { methodNotAllowed } from "../middleware/errors.mjs";

export function createMarksRoutes({ storage, http }) {
  return async function routeMarks({ req, res, parsed, access }) {
    if (parsed.pathname === "/api/reasons") {
      if (req.method === "GET") {
        http.sendJson(res, 200, { ok: true, ...(await storage.readReviewReasons()), revision: await storage.fileRevision(storage.REASONS_FILE) }, access.headers);
        return true;
      }
      if (req.method === "POST") {
        const data = await storage.writeReviewReasons(await http.readJsonBody(req, 1_000_000));
        http.sendJson(res, 200, { ok: true, ...data, revision: await storage.fileRevision(storage.REASONS_FILE) }, access.headers);
        return true;
      }
      return methodNotAllowed(res, http.sendJson, access.headers);
    }
    if (parsed.pathname === "/api/sync") {
      const beforeRevisions = await storage.reviewStateRevisions();
      let conflicts = {};
      if (req.method === "POST") {
        const body = await http.readJsonBody(req, 6_000_000);
        const base = body.baseRevisions && typeof body.baseRevisions === "object" ? body.baseRevisions : {};
        conflicts = {
          marks: Boolean(base.marks && base.marks !== beforeRevisions.marks),
          reasons: Boolean(base.reasons && base.reasons !== beforeRevisions.reasons),
          brands: Boolean(base.brands && base.brands !== beforeRevisions.brands),
        };
        if (body.marks) await storage.writeReviewMarks(body.marks);
        if (body.reasons) await storage.writeReviewReasons(body.reasons);
      } else if (req.method !== "GET") {
        return methodNotAllowed(res, http.sendJson, access.headers);
      }
      const light = parsed.searchParams.get("light") === "1";
      const [brands, reasons, marks, revisions] = await Promise.all([
        storage.loadBrandsConfig({ includeDisabled: true }),
        storage.readReviewReasons(),
        light ? Promise.resolve(undefined) : storage.readReviewMarks(),
        storage.reviewStateRevisions(),
      ]);
      http.sendJson(res, 200, { ok: true, serverTime: new Date().toISOString(), marks, marksLight: light, reasons, brands, revisions, conflicts }, access.headers);
      return true;
    }
    if (parsed.pathname === "/api/marks") {
      if (req.method === "GET") {
        const brands = await storage.loadBrandsConfig({ includeDisabled: true }).catch(() => ({ brands: [] }));
        const filtered = storage.filterReviewMarks(await storage.readReviewMarks(), {
          brand: parsed.searchParams.get("brand") || "",
          date: parsed.searchParams.get("date") || "",
          verdict: parsed.searchParams.get("verdict") || "",
        }, brands);
        http.sendJson(res, 200, { ok: true, marks: filtered, total: Object.keys(filtered).length, revision: await storage.fileRevision(storage.MARKS_FILE) }, access.headers);
        return true;
      }
      if (req.method === "POST") {
        const body = await http.readJsonBody(req, 5_000_000);
        const beforeRevision = await storage.fileRevision(storage.MARKS_FILE);
        const merged = await storage.writeReviewMarks(body.marks);
        const compact = parsed.searchParams.get("compact") === "1";
        const responseMarks = compact
          ? Object.fromEntries(Object.keys(body.marks || {}).filter((key) => merged[key]).map((key) => [key, merged[key]]))
          : merged;
        http.sendJson(res, 200, {
          ok: true,
          marks: responseMarks,
          revision: await storage.fileRevision(storage.MARKS_FILE),
          conflict: Boolean(body.baseRevision && body.baseRevision !== beforeRevision),
        }, access.headers);
        return true;
      }
      if (req.method === "DELETE") {
        const result = await storage.deleteReviewMarks({ date: parsed.searchParams.get("date") || "" });
        http.sendJson(res, 200, { ok: true, deleted: result.deleted, revision: await storage.fileRevision(storage.MARKS_FILE) }, access.headers);
        return true;
      }
      return methodNotAllowed(res, http.sendJson, access.headers);
    }
    if (parsed.pathname === "/api/datasets/delete") {
      if (req.method !== "POST" && req.method !== "DELETE") return methodNotAllowed(res, http.sendJson, access.headers);
      const body = req.method === "DELETE" ? { date: parsed.searchParams.get("date") } : await http.readJsonBody(req);
      http.sendJson(res, 200, { ok: true, ...(await storage.deleteDatasetByDate(body.date)) }, access.headers);
      return true;
    }
    return false;
  };
}

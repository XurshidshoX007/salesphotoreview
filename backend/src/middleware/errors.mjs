export function methodNotAllowed(res, sendJson, headers = {}) {
  sendJson(res, 405, { ok: false, error: "Method not allowed" }, headers);
  return true;
}

export function handleRequestError(req, res, error, sendJson) {
  if (!String(req.url || "").startsWith("/api/")) return false;
  sendJson(res, Number(error?.status || 500), {
    ok: false,
    error: String(error?.message || error),
  });
  return true;
}

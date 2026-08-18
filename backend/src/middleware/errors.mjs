export function methodNotAllowed(res, sendJson, headers = {}) {
  sendJson(res, 405, { ok: false, error: "Method not allowed" }, headers);
  return true;
}

export function handleRequestError(req, res, error, sendJson) {
  if (!String(req.url || "").startsWith("/api/")) return false;
  const status = Number(error?.status || 500);
  const expose = Boolean(error?.expose) || (status < 500 && Boolean(error?.status));
  if (status >= 500) console.error("API xatosi:", error);
  sendJson(res, status, {
    ok: false,
    error: expose ? String(error?.message || "So'rov xato") : "Ichki server xatosi",
  });
  return true;
}

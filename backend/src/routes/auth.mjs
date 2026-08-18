import { methodNotAllowed } from "../middleware/errors.mjs";

export function createAuthRoutes({ auth, http }) {
  return async function routeAuth({ req, res, parsed }) {
    if (parsed.pathname === "/api/access/login") {
      if (req.method !== "POST") return methodNotAllowed(res, http.sendJson);
      const ip = auth.clientIp(req);
      const limit = auth.loginRateLimiter.check(ip);
      if (limit.blocked) {
        const retryAfter = Math.max(1, Math.ceil(limit.retryAfterMs / 1000));
        http.sendJson(res, 429, {
          ok: false,
          error: "Juda ko'p noto'g'ri urinish. Birozdan keyin qayta urinib ko'ring.",
          retryAfter,
        }, { "Retry-After": String(retryAfter) });
        return true;
      }
      const pin = auth.reviewAccessPin();
      const given = await auth.readPinFromRequest(req);
      if (!pin || !auth.safeCompareSecret(given, pin)) {
        const failed = auth.loginRateLimiter.fail(ip);
        if (failed.blocked) {
          const retryAfter = Math.max(1, Math.ceil(failed.retryAfterMs / 1000));
          http.sendJson(res, 429, {
            ok: false,
            error: "Juda ko'p noto'g'ri urinish. Birozdan keyin qayta urinib ko'ring.",
            retryAfter,
          }, { "Retry-After": String(retryAfter) });
          return true;
        }
        if (/application\/json/i.test(String(req.headers["content-type"] || ""))) {
          http.sendJson(res, 401, { ok: false, error: "PIN/parol noto'g'ri" });
        } else {
          res.writeHead(303, { Location: "/?login=failed" });
          res.end();
        }
        return true;
      }
      auth.loginRateLimiter.reset(ip);
      if (/application\/json/i.test(String(req.headers["content-type"] || ""))) {
        http.sendJson(res, 200, { ok: true }, { "Set-Cookie": auth.pinSessionCookieHeader(req) });
      } else {
        res.writeHead(303, {
          Location: "/lmj_date_photo_review.html",
          "Set-Cookie": auth.pinSessionCookieHeader(req),
        });
        res.end();
      }
      return true;
    }
    if (parsed.pathname === "/api/access/logout") {
      auth.invalidatePinSession(req);
      res.writeHead(303, { Location: "/", "Set-Cookie": auth.clearPinSessionCookieHeader(req) });
      res.end();
      return true;
    }
    return false;
  };
}

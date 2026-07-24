import { methodNotAllowed } from "../middleware/errors.mjs";

export function createAuthRoutes({ auth, http }) {
  return async function routeAuth({ req, res, parsed }) {
    if (parsed.pathname === "/api/access/login") {
      if (req.method !== "POST") return methodNotAllowed(res, http.sendJson);
      const pin = auth.reviewAccessPin();
      const given = await auth.readPinFromRequest(req);
      if (!pin || !auth.safeCompareSecret(given, pin)) {
        if (/application\/json/i.test(String(req.headers["content-type"] || ""))) {
          http.sendJson(res, 401, { ok: false, error: "PIN/parol noto'g'ri" });
        } else {
          res.writeHead(303, { Location: "/" });
          res.end();
        }
        return true;
      }
      if (/application\/json/i.test(String(req.headers["content-type"] || ""))) {
        http.sendJson(res, 200, { ok: true }, { "Set-Cookie": auth.pinSessionCookieHeader() });
      } else {
        res.writeHead(303, {
          Location: "/lmj_date_photo_review.html",
          "Set-Cookie": auth.pinSessionCookieHeader(),
        });
        res.end();
      }
      return true;
    }
    if (parsed.pathname === "/api/access/logout") {
      res.writeHead(303, { Location: "/", "Set-Cookie": auth.clearPinSessionCookieHeader() });
      res.end();
      return true;
    }
    return false;
  };
}

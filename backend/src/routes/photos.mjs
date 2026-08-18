import { methodNotAllowed } from "../middleware/errors.mjs";

export function createPhotoRoutes({ photos, http }) {
  return async function routePhotos({ req, res, parsed, access }) {
    if (parsed.pathname === "/api/photo") {
      const url = parsed.searchParams.get("url");
      const variant = parsed.searchParams.get("view") === "thumb" ? "thumb" : "full";
      const etag = `W/"photo-${variant}-${photos.photoCacheKey(url)}"`;
      if (req.headers["if-none-match"] === etag) {
        res.writeHead(304, { "Cache-Control": "public, max-age=604800, immutable", ETag: etag, ...access.headers });
        res.end();
        return true;
      }
      const photo = variant === "thumb" ? await photos.proxyPhotoThumbnail(url) : await photos.proxyPhoto(url);
      res.writeHead(200, {
        "Content-Type": photo.contentType,
        "Cache-Control": "public, max-age=604800, immutable",
        ETag: etag,
        "X-Photo-Cache": photo.cached ? "hit" : "miss",
        "X-Photo-Variant": variant,
        ...access.headers,
      });
      res.end(photo.data);
      return true;
    }
    if (parsed.pathname === "/api/suspicious-photos") {
      if (req.method === "GET") {
        const data = parsed.searchParams.get("rebuild") === "1"
          ? await photos.rebuildSuspiciousPhotosFromMarks(await photos.readReviewMarks())
          : await photos.readSuspiciousPhotos();
        http.sendJson(res, 200, { ok: true, total: data.items.length, updatedAt: data.updatedAt, items: data.items }, access.headers);
        return true;
      }
      if (req.method === "POST") {
        const data = await photos.rebuildSuspiciousPhotosFromMarks(await photos.readReviewMarks());
        http.sendJson(res, 200, { ok: true, total: data.items.length, updatedAt: data.updatedAt, items: data.items }, access.headers);
        return true;
      }
      return methodNotAllowed(res, http.sendJson, access.headers);
    }
    if (parsed.pathname === "/api/photo-metrics") {
      if (req.method === "GET") {
        const data = await photos.readPhotoMetricsCache();
        http.sendJson(res, 200, { ok: true, total: data.total, updatedAt: data.updatedAt, items: data.items }, access.headers);
        return true;
      }
      if (req.method === "POST") {
        const data = await photos.writePhotoMetricsCache(await http.readJsonBody(req, 5_000_000));
        http.sendJson(res, 200, { ok: true, total: data.total, updatedAt: data.updatedAt }, access.headers);
        return true;
      }
      return methodNotAllowed(res, http.sendJson, access.headers);
    }
    return false;
  };
}

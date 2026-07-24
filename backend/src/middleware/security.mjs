export function requestIsSecure(req, { trustCloudflare = false } = {}) {
  if (req?.socket?.encrypted) return true;
  const remote = String(req?.socket?.remoteAddress || "").replace(/^::ffff:/, "");
  const loopback = remote === "127.0.0.1" || remote === "::1";
  if (!trustCloudflare || !loopback) return false;
  if (String(req?.headers?.["x-forwarded-proto"] || "").split(",")[0].trim() === "https") return true;
  try {
    return JSON.parse(String(req?.headers?.["cf-visitor"] || "{}")).scheme === "https";
  } catch {
    return false;
  }
}

export function applySecurityHeaders(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self'; font-src 'self' data:"
  );
  if (requestIsSecure(req, { trustCloudflare: process.env.TRUST_CLOUDFLARE_PROXY === "1" })) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

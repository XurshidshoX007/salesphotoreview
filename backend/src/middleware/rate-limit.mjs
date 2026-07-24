import { isIP } from "node:net";

function cleanIp(value) {
  const text = String(value || "").trim().replace(/^\[|\]$/g, "");
  if (text.startsWith("::ffff:")) return text.slice(7);
  return isIP(text) ? text : "";
}

function isLoopback(value) {
  const ip = cleanIp(value);
  return ip === "127.0.0.1" || ip === "::1";
}

export function clientIp(req, { trustCloudflare = false } = {}) {
  const remote = cleanIp(req?.socket?.remoteAddress);
  if (trustCloudflare && isLoopback(remote)) {
    const cloudflare = cleanIp(req?.headers?.["cf-connecting-ip"]);
    if (cloudflare) return cloudflare;
  }
  return remote || "unknown";
}

export function createFailureRateLimiter({
  windowMs = 10 * 60_000,
  maxFailures = 5,
  cleanupMs = 60_000,
} = {}) {
  const clients = new Map();

  function cleanup(now = Date.now()) {
    for (const [key, record] of clients) {
      if (now - record.startedAt >= windowMs) clients.delete(key);
    }
  }

  const timer = setInterval(cleanup, Math.max(10_000, cleanupMs));
  timer.unref?.();

  return {
    check(key) {
      const record = clients.get(key);
      if (!record) return { blocked: false, remaining: maxFailures };
      const now = Date.now();
      if (now - record.startedAt >= windowMs) {
        clients.delete(key);
        return { blocked: false, remaining: maxFailures };
      }
      const retryAfterMs = Math.max(0, windowMs - (now - record.startedAt));
      return {
        blocked: record.failures >= maxFailures,
        remaining: Math.max(0, maxFailures - record.failures),
        retryAfterMs,
      };
    },
    fail(key) {
      const now = Date.now();
      const current = clients.get(key);
      const record = !current || now - current.startedAt >= windowMs
        ? { failures: 0, startedAt: now }
        : current;
      record.failures += 1;
      clients.set(key, record);
      return this.check(key);
    },
    reset(key) {
      clients.delete(key);
    },
    close() {
      clearInterval(timer);
      clients.clear();
    },
  };
}

export function createRateLimiter({ windowMs = 60_000, max = 120 } = {}) {
  const limiter = createFailureRateLimiter({ windowMs, maxFailures: max });
  return function isRateLimited(key) {
    const status = limiter.check(key);
    if (status.blocked) return true;
    return limiter.fail(key).blocked;
  };
}

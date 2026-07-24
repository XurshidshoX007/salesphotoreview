export function createRateLimiter({ windowMs = 60_000, max = 120 } = {}) {
  const clients = new Map();
  return function isRateLimited(key) {
    if (!key) return false;
    const now = Date.now();
    const current = clients.get(key);
    if (!current || now - current.startedAt >= windowMs) {
      clients.set(key, { count: 1, startedAt: now });
      return false;
    }
    current.count += 1;
    if (clients.size > 2_000) {
      for (const [client, item] of clients) {
        if (now - item.startedAt >= windowMs) clients.delete(client);
      }
    }
    return current.count > max;
  };
}

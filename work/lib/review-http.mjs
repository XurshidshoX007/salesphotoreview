export function sendJson(res, status, data, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(JSON.stringify(data));
}

export async function readJsonBody(req, limit = 512_000) {
  const text = await readTextBody(req, limit);
  try {
    return JSON.parse(text || "{}");
  } catch {
    throw apiError("JSON body noto'g'ri", 400);
  }
}

export async function readTextBody(req, limit = 64_000) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > limit) throw apiError("Body juda katta", 413);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function isValidIsoDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y
    && date.getMonth() === m - 1
    && date.getDate() === d;
}

export function apiError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mapWithConcurrency(items, limit, worker) {
  const list = Array.isArray(items) ? items : [];
  const results = [];
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(Number(limit) || 1, list.length || 1));
  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < list.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(list[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

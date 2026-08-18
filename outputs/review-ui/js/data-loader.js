window.PhotoReviewDataLoader = (() => {
  const buildBase = "";
  const runtimeBase = String(window.__API_BASE_URL__ || "").trim();
  const apiBase = (runtimeBase || (buildBase.startsWith("__") ? "" : buildBase)).replace(/\/$/, "");

  function resolveUrl(url) {
    const value = String(url || "");
    return apiBase && value.startsWith("/api/") ? `${apiBase}${value}` : value;
  }

  async function requestJson(url, options = {}) {
    const timeout = Math.max(1000, Number(options.timeout || 15_000));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(resolveUrl(url), { ...options, signal: controller.signal, credentials: options.credentials || "same-origin" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
      return data;
    } catch (error) {
      if (error?.name === "AbortError") throw new Error("Server javob berish vaqti tugadi");
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  const getJson = (url, options = {}) => requestJson(url, { ...options, method: "GET" });
  const postJson = (url, body = {}, options = {}) => requestJson(url, {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    body: JSON.stringify(body),
  });

  return { apiBase, resolveUrl, requestJson, getJson, postJson };
})();

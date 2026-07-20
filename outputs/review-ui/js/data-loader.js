window.PhotoReviewDataLoader = (() => {
  async function requestJson(url, options = {}) {
    const timeout = Math.max(1000, Number(options.timeout || 15_000));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      return data;
    } catch (error) {
      if (error?.name === "AbortError") throw new Error("Server javob berish vaqti tugadi");
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  function getJson(url, options = {}) {
    return requestJson(url, { ...options, method: "GET" });
  }

  function postJson(url, body = {}, options = {}) {
    return requestJson(url, {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      body: JSON.stringify(body),
    });
  }

  return { requestJson, getJson, postJson };
})();

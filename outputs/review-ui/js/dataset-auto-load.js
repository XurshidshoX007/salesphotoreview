window.PhotoReviewDatasetAutoLoad = (() => {
  const messages = {
    SALES_CREDENTIALS_MISSING: "Sales login ma'lumotlari serverda sozlanmagan",
    SALES_LOGIN_FAILED: "Sales login yoki paroli qabul qilinmadi",
    SALES_TIMEOUT: "Sales serveri javob berish vaqti tugadi",
    SALES_NETWORK_ERROR: "Sales serveriga ulanib bo'lmadi",
    SALES_RATE_LIMIT: "Sales so'rovlar chegarasiga yetdi. Birozdan keyin qayta urinib ko'ring",
    INVALID_DATE: "Tanlangan sana noto'g'ri",
    INVALID_BRAND: "Tanlangan brend topilmadi yoki faol emas",
    COLLECT_BUSY: "Server boshqa ma'lumotni tayyorlamoqda",
    COLLECT_PROCESS_FAILED: "Ma'lumot yig'ish jarayoni xato bilan tugadi",
    DATASET_INVALID: "Yig'ilgan ma'lumot tekshiruvdan o'tmadi",
    DATASET_WRITE_FAILED: "Datasetni diskka saqlab bo'lmadi",
    UNKNOWN_ERROR: "Noma'lum xato yuz berdi",
  };
  const temporaryCodes = new Set(["SALES_TIMEOUT", "SALES_NETWORK_ERROR", "SALES_RATE_LIMIT"]);

  function errorMessage(result) {
    return messages[result?.code] || String(result?.error || "Ma'lumotni tayyorlab bo'lmadi");
  }

  function create({
    request,
    onState = () => {},
    onReady = () => {},
    isCurrent = () => true,
    debounceMs = 450,
    pollMs = 1000,
    maxAutoRetries = 2,
  }) {
    let sequence = 0;
    let debounceTimer = null;
    let pollTimer = null;
    let controller = null;

    function cancel() {
      sequence += 1;
      clearTimeout(debounceTimer);
      clearTimeout(pollTimer);
      debounceTimer = null;
      pollTimer = null;
      controller?.abort();
      controller = null;
    }

    function active(seq, selection) {
      return seq === sequence && isCurrent(selection);
    }

    function schedulePoll(seq, selection, mode, retries) {
      clearTimeout(pollTimer);
      pollTimer = setTimeout(() => run(seq, selection, mode, retries), pollMs);
    }

    async function run(seq, selection, mode = "ensure", retries = 0) {
      if (!active(seq, selection)) return;
      controller?.abort();
      controller = new AbortController();
      try {
        const query = new URLSearchParams(selection).toString();
        const result = mode === "status"
          ? await request(`/api/datasets/status?${query}`, { method: "GET", signal: controller.signal })
          : await request("/api/datasets/ensure", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(selection),
            signal: controller.signal,
          });
        if (!active(seq, selection)) return;
        if (result.status === "ready" || result.status === "partial") {
          onState({ ...result, message: "" }, selection);
          await onReady(result, selection);
          return;
        }
        if (result.status === "collecting") {
          onState(result, selection);
          schedulePoll(seq, selection, "status", retries);
          return;
        }
        if (result.status === "busy") {
          onState(result, selection);
          schedulePoll(seq, selection, "ensure", retries);
          return;
        }
        const code = result.code || "UNKNOWN_ERROR";
        if (temporaryCodes.has(code) && retries < maxAutoRetries) {
          onState({ ...result, status: "checking", retrying: true, message: "Qayta ulanmoqda..." }, selection);
          schedulePoll(seq, selection, "ensure", retries + 1);
          return;
        }
        onState({ ...result, status: "error", message: errorMessage(result) }, selection);
      } catch (error) {
        if (error?.name === "AbortError" || !active(seq, selection)) return;
        if (retries < maxAutoRetries) {
          onState({
            ok: false,
            status: "checking",
            code: "SALES_NETWORK_ERROR",
            retrying: true,
            message: "Qayta ulanmoqda...",
          }, selection);
          schedulePoll(seq, selection, "ensure", retries + 1);
          return;
        }
        onState({
          ok: false,
          status: "error",
          code: "SALES_NETWORK_ERROR",
          error: error?.message || "Server bilan aloqa uzildi",
          message: "Server bilan aloqa uzildi",
        }, selection);
      }
    }

    function schedule(selection, { immediate = false } = {}) {
      cancel();
      const seq = sequence;
      onState({ ok: true, status: "checking" }, selection);
      debounceTimer = setTimeout(() => run(seq, selection, "ensure", 0), immediate ? 0 : debounceMs);
    }

    function retry(selection) {
      schedule(selection, { immediate: true });
    }

    return Object.freeze({ cancel, retry, schedule });
  }

  return { create, errorMessage, messages };
})();

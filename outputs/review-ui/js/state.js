window.PhotoReviewState = (() => {
  function parseJson(value, fallback) { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } }
  function clone(value) { return typeof structuredClone === "function" ? structuredClone(value) : parseJson(JSON.stringify(value), value); }
  function clientId(storage, key) {
    const current = storage.getItem(key);
    if (current) return current;
    const value = `web-${globalThis.crypto?.randomUUID?.() || Date.now().toString(36)}`;
    storage.setItem(key, value);
    return value;
  }
  function recordTime(value) {
    const time = Date.parse(value?.updatedAt || value?.savedAt || value?.approvedAt || value?.telegramSentAt || "");
    return Number.isFinite(time) ? time : 0;
  }
  function mergeRecord(previous, incoming) {
    if (!previous) return { ...incoming };
    if (!incoming) return { ...previous };
    const newer = recordTime(previous) > recordTime(incoming) ? previous : incoming;
    const next = { ...(newer === previous ? incoming : previous), ...newer };
    if (previous.telegramSentAt || incoming.telegramSentAt) next.telegramSentAt = previous.telegramSentAt || incoming.telegramSentAt;
    return next;
  }
  function mergeRecords(target, source) { for (const [key, value] of Object.entries(source || {})) target[key] = mergeRecord(target[key], value); return target; }
  function changed(previous, next) {
    if (!previous || !next) return previous !== next;
    for (const key of new Set([...Object.keys(previous), ...Object.keys(next)])) {
      const a = previous[key]; const b = next[key];
      if (Array.isArray(a) || Array.isArray(b) ? JSON.stringify(a || []) !== JSON.stringify(b || []) : a !== b) return true;
    }
    return false;
  }
  return { parseJson, clone, clientId, recordTime, mergeRecord, mergeRecords, changed };
})();

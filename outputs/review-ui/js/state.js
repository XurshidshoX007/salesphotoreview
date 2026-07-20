window.PhotoReviewState = (() => {
  function parseJson(value, fallback) {
    try {
      const parsed = JSON.parse(value);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  function clone(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return parseJson(JSON.stringify(value), value);
  }

  function clientId(storage, key) {
    const current = storage.getItem(key);
    if (current) return current;
    const random = globalThis.crypto?.randomUUID?.() || Date.now().toString(36);
    const value = `web-${random}`;
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
    const older = newer === previous ? incoming : previous;
    const next = { ...older, ...newer };
    if (previous.telegramSentAt || incoming.telegramSentAt) {
      next.telegramSentAt = previous.telegramSentAt || incoming.telegramSentAt;
    }
    return next;
  }

  function mergeRecords(target, source) {
    for (const [key, value] of Object.entries(source || {})) {
      target[key] = mergeRecord(target[key], value);
    }
    return target;
  }

  function changed(previous, next) {
    if (!previous || !next) return previous !== next;
    const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
    for (const key of keys) {
      const a = previous[key];
      const b = next[key];
      if (Array.isArray(a) || Array.isArray(b)) {
        if (JSON.stringify(a || []) !== JSON.stringify(b || [])) return true;
      } else if (a !== b) return true;
    }
    return false;
  }

  return { parseJson, clone, clientId, recordTime, mergeRecord, mergeRecords, changed };
})();

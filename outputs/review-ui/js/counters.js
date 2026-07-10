window.PhotoReviewCounters = (() => {
  const TOOLTIP = {
    total: "Datasetdagi barcha foto soni.",
    scanned: "Avto-tekshiruv ko'rgan foto soni.",
    candidate: "Shubhali deb ajratilgan barcha nomzod foto.",
    strong: "Yuqori ishonchli minus nomzodlar, yakuniy hukm emas.",
    protected: "Buyurtmasi bor, avtomatik minus qilinmaydigan fotolar.",
    alreadyMinus: "Oldin foydalanuvchi minus qilgan fotolar.",
    knownMinus: "Eski minus bazadagi yozuvlar soni.",
    knownSample: "Avto-tekshiruv bazaga solishtirgan minus namunalar soni.",
  };

  function autoReviewCounters(rows, stats = {}) {
    const list = Array.isArray(rows) ? rows : [];
    const minusRows = list.filter((item) => !item.orderProtected);
    return {
      total: stats.total ?? list.length,
      scanned: stats.scanned ?? list.length,
      candidate: list.length,
      strong: minusRows.filter((item) => Number(item.score || 0) >= 0.85).length,
      protected: list.filter((item) => item.orderProtected).length,
      alreadyMinus: stats.alreadyMinus ?? 0,
      knownMinus: stats.knownMinus ?? 0,
      knownSample: stats.knownSample ?? 0,
    };
  }

  function card(label, value, tipKey) {
    return `<div class="listStat" title="${TOOLTIP[tipKey] || ""}"><span>${label}</span><b>${value}</b></div>`;
  }

  function renderAutoReviewCounterCards(counters) {
    return [
      card("Jami foto", counters.total, "total"),
      card("Tekshirildi", counters.scanned, "scanned"),
      card("Nomzod", counters.candidate, "candidate"),
      card("Aniq minus", counters.strong, "strong"),
      card("Buyurtmali", counters.protected, "protected"),
      card("Oldin minus", counters.alreadyMinus, "alreadyMinus"),
      card("Baza minus", counters.knownMinus, "knownMinus"),
      card("Bazada ko'rildi", counters.knownSample, "knownSample"),
    ].join("");
  }

  return { autoReviewCounters, renderAutoReviewCounterCards };
})();

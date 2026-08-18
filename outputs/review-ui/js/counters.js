window.PhotoReviewCounters = (() => {
  function summarize(agents, marks, date) {
    const photos = agents.reduce((sum, agent) => sum + (agent.photos?.length || 0), 0);
    const dateMarks = Object.values(marks || {}).filter((mark) => mark && !mark._deleted && mark.date === date);
    const minus = dateMarks.filter((mark) => String(mark.verdict || "").toUpperCase() === "MINUS").length;
    const ok = dateMarks.filter((mark) => String(mark.verdict || "").toUpperCase() === "OK").length;
    return { agents: agents.length, photos, minus, ok, reviewed: minus + ok };
  }

  function renderDateStats(target, stats) {
    if (!target) return;
    target.innerHTML = [
      ["Agent", stats.agents],
      ["Foto", stats.photos],
      ["Minus", stats.minus],
      ["OK", stats.ok],
    ].map(([label, value]) => `<div class="photoStat"><span>${label}</span><b>${value}</b></div>`).join("");
  }

  return { summarize, renderDateStats };
})();

window.PhotoReviewExport = (() => {
  function downloadCsv(name, rows) {
    const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const text = rows.map((row) => row.map(escape).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([`\ufeff${text}\n`], { type: "text/csv;charset=utf-8" }));
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function minusRows(marks, date) {
    const header = ["date", "code", "agent", "photo", "client", "photoTime", "reasons", "note", "url"];
    const rows = Object.values(marks || {})
      .filter((mark) => mark && !mark._deleted && mark.verdict === "MINUS" && (!date || mark.date === date));
    return [header, ...rows.map((mark) => header.map((key) => Array.isArray(mark[key]) ? mark[key].join("; ") : mark[key]))];
  }

  function agentRows(agents, marks, date) {
    const header = ["code", "agent", "photos", "minus", "ok", "orderSum"];
    return [header, ...(agents || []).map((agent) => {
      const related = Object.values(marks || {}).filter((mark) => mark && !mark._deleted && mark.date === date && mark.code === agent.code);
      return [
        agent.code,
        agent.agent,
        agent.photos.length,
        related.filter((mark) => mark.verdict === "MINUS").length,
        related.filter((mark) => mark.verdict === "OK").length,
        agent.orderSum,
      ];
    })];
  }

  return { downloadCsv, minusRows, agentRows };
})();

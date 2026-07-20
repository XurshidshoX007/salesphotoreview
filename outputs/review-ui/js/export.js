window.PhotoReviewExport = (() => {
  function money(value) {
    const number = Number(value || 0);
    return number ? Math.round(number).toLocaleString("ru-RU").replace(/[\s\u00a0\u202f]/g, "") : "";
  }

  function csvCell(value) {
    const text = String(value ?? "");
    return /[";,\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }

  function csvRow(values, separator = ";") {
    return values.map(csvCell).join(separator);
  }

  return { money, csvCell, csvRow };
})();

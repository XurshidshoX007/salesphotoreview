window.PhotoReviewExport = (() => {
  function money(value) {
    const number = Number(value || 0);
    return number ? Math.round(number).toLocaleString("ru-RU").replace(/[\s\u00a0\u202f]/g, "") : "";
  }

  return { money };
})();

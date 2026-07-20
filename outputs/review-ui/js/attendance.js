window.PhotoReviewAttendance = (() => {
  function nextIsoDate(date) {
    const value = new Date(`${date}T00:00:00`);
    if (Number.isNaN(value.getTime())) return "";
    value.setDate(value.getDate() + 1);
    return value.toISOString().slice(0, 10);
  }

  function validIsoDate(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(date || ""));
  }

  function valueLooksValid(value) {
    const text = String(value ?? "").trim();
    if (!text) return true;
    if (/[kb\u043a]/i.test(text)) return false;
    return /^\d+([sS])?$/.test(text);
  }

  return { nextIsoDate, validIsoDate, valueLooksValid };
})();

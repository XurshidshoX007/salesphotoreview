window.PhotoReviewAttendance = (() => {
  function nextIsoDate(date) {
    const value = new Date(`${date}T00:00:00`);
    if (Number.isNaN(value.getTime())) return "";
    value.setDate(value.getDate() + 1);
    return value.toISOString().slice(0, 10);
  }
  const validIsoDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(String(date || ""));
  function valueLooksValid(value) {
    const text = String(value ?? "").trim();
    if (!text) return true;
    if (/[kb\u043a]/i.test(text)) return false;
    return /^\d+([sS])?$/.test(text);
  }
  function indexDays(days) {
    return new Map((days || []).map((day) => [Number(day.day), day]));
  }
  function isActionableDay(day) {
    return Boolean(day && (["low", "zero_activity", "missing_dataset"].includes(day.state) || day.manual));
  }
  function employeeAvailable(employee, date) {
    if (!employee) return false;
    if (employee.hireDate && date < employee.hireDate) return false;
    if (employee.leftDate && date > employee.leftDate) return false;
    return true;
  }
  return { nextIsoDate, validIsoDate, valueLooksValid, indexDays, isActionableDay, employeeAvailable };
})();

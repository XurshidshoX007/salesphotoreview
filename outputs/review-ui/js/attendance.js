window.PhotoReviewAttendance = (() => {
  function nextIsoDate(date) {
    const match = String(date || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return "";
    const value = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (Number.isNaN(value.getTime())) return "";
    value.setDate(value.getDate() + 1);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
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

window.PhotoReviewUtils = (() => {
  const $ = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
  const formatNumber = (value) => Number(value || 0).toLocaleString("ru-RU");
  function toast(message, timeout = 2800) {
    const node = $("toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => node.classList.remove("show"), timeout);
  }
  function pad(value) {
    return String(value).padStart(2, "0");
  }
  function monthDays(month) {
    const match = String(month || "").match(/^(\d{4})-(\d{2})$/);
    if (!match) return 31;
    return new Date(Number(match[1]), Number(match[2]), 0).getDate();
  }
  return { $, escapeHtml, formatNumber, toast, pad, monthDays };
})();

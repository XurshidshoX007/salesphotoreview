window.PhotoReviewUiState = (() => {
  function escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function markup(title, message = "", options = {}) {
    const type = ["loading", "error", "success"].includes(options.type) ? options.type : "empty";
    const compact = options.compact ? " compact" : "";
    const icon = type === "error" ? "!" : type === "success" ? "✓" : "";
    const actionId = options.actionId ? ` id="${escape(options.actionId)}"` : "";
    const actionClass = options.actionClass === "primary" ? ' class="primary"' : "";
    const action = options.actionText
      ? `<button${actionId}${actionClass} type="button" data-view-state-action>${escape(options.actionText)}</button>`
      : "";
    return `<div class="viewState ${type}${compact}"><span class="viewStateIcon" aria-hidden="true">${icon}</span><b>${escape(title)}</b>${message ? `<span>${escape(message)}</span>` : ""}${action}</div>`;
  }

  function render(target, title, message = "", options = {}) {
    if (!target) return;
    target.innerHTML = markup(title, message, options);
    const button = target.querySelector("[data-view-state-action]");
    if (button && typeof options.onAction === "function") button.addEventListener("click", options.onAction, { once: true });
  }

  return { markup, render };
})();

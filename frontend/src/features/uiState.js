window.PhotoReviewUiState = (() => {
  const $ = (id) => document.getElementById(id);
  const panels = ["attendancePanel", "adminStatsPanel", "minusList", "autoReviewList", "collectPanel", "brandPanel", "attendanceReplaceModal"];

  function setOpen(id, open) {
    const node = $(id);
    if (!node) return;
    node.classList.toggle("open", open);
    node.setAttribute("aria-hidden", open ? "false" : "true");
  }

  function closeAll() {
    for (const id of panels) setOpen(id, false);
    document.body.classList.remove("sectionOpen", "photoViewHidden");
    const closeBtn = $("sectionCloseBtn");
    if (closeBtn) closeBtn.hidden = true;
  }

  function openPanel(id) {
    closeAll();
    setOpen(id, true);
    document.body.classList.add("sectionOpen");
    if (id !== "collectPanel") document.body.classList.add("photoViewHidden");
    const closeBtn = $("sectionCloseBtn");
    if (closeBtn) closeBtn.hidden = false;
  }

  function setFilterOpen(open) {
    const panel = $("reviewFilters");
    const button = $("filterToggleBtn");
    const backdrop = $("filterBackdrop");
    if (panel) {
      panel.classList.toggle("open", open);
      panel.setAttribute("aria-hidden", open ? "false" : "true");
    }
    if (button) button.setAttribute("aria-expanded", open ? "true" : "false");
    if (backdrop) backdrop.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.classList.toggle("filtersOpen", open);
  }

  function setTheme(dark) {
    document.documentElement.classList.toggle("dark", dark);
    const button = $("themeToggleBtn");
    if (button) button.textContent = dark ? "Kunduzgi rejim" : "Tungi rejim";
    try { localStorage.setItem("lmjTheme", dark ? "dark" : "light"); } catch {}
  }

  return { panels, setOpen, closeAll, openPanel, setFilterOpen, setTheme };
})();

window.PhotoReviewFilters = (() => {
  function cleanDate(value) {
    return String(value || "").match(/\d{4}-\d{2}-\d{2}/)?.[0] || "";
  }

  function cleanDatasetDate(value) {
    return cleanDate(String(value || "").replace(/\s*\[[^\]]+\]\s*$/, ""));
  }

  function datasetDate(item) {
    return cleanDatasetDate(item?.date) || cleanDate(item?.label);
  }

  function optionKey(item, brandId = "") {
    return `${datasetDate(item)}||${brandId}||${item?.file || ""}`;
  }

  function normalizeText(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  return { cleanDate, cleanDatasetDate, datasetDate, optionKey, normalizeText };
})();

window.PhotoReviewFilters = (() => {
  const cleanDate = (value) => String(value || "").match(/\d{4}-\d{2}-\d{2}/)?.[0] || "";
  const cleanDatasetDate = (value) => cleanDate(String(value || "").replace(/\s*\[[^\]]+\]\s*$/, ""));
  const datasetDate = (item) => cleanDatasetDate(item?.date) || cleanDate(item?.label);
  const optionKey = (item, brandId = "") => `${datasetDate(item)}||${brandId}||${item?.file || ""}`;
  const normalizeText = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  return { cleanDate, cleanDatasetDate, datasetDate, optionKey, normalizeText };
})();

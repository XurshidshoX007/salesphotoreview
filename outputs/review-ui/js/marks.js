window.PhotoReviewMarks = (() => {
  function isReviewed(mark) {
    return Boolean(mark && !mark._deleted && ["OK", "MINUS"].includes(String(mark.verdict || "").toUpperCase()));
  }

  function isMinus(mark) {
    return Boolean(mark && !mark._deleted && String(mark.verdict || "").toUpperCase() === "MINUS");
  }

  function filter(records, options = {}) {
    return Object.entries(records || {}).filter(([, mark]) => {
      if (options.date && String(mark?.date || "") !== options.date) return false;
      if (options.verdict && String(mark?.verdict || "").toUpperCase() !== String(options.verdict).toUpperCase()) return false;
      if (options.includeDeleted !== true && mark?._deleted) return false;
      return true;
    });
  }

  return { isReviewed, isMinus, filter };
})();

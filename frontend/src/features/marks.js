window.PhotoReviewMarks = (() => {
  const isReviewed = (mark) => Boolean(mark && !mark._deleted && ["OK", "MINUS"].includes(String(mark.verdict || "").toUpperCase()));
  const isMinus = (mark) => Boolean(mark && !mark._deleted && String(mark.verdict || "").toUpperCase() === "MINUS");
  function filter(records, options = {}) {
    return Object.entries(records || {}).filter(([, mark]) => {
      if (options.date && String(mark?.date || "") !== options.date) return false;
      if (options.verdict && String(mark?.verdict || "").toUpperCase() !== String(options.verdict).toUpperCase()) return false;
      return options.includeDeleted === true || !mark?._deleted;
    });
  }
  return { isReviewed, isMinus, filter };
})();

window.PhotoReviewUtils = (() => {
  function collectStatusFromCounts(actualUrls, expectedPhotos) {
    const actual = Number(actualUrls);
    if (expectedPhotos === null || expectedPhotos === undefined || expectedPhotos === "") return "unknown";
    const expected = Number(expectedPhotos);
    if (!Number.isFinite(expected)) return "unknown";
    if (actual === expected) return "ok";
    if (actual === 0) return "empty";
    if (actual < expected) return "partial";
    if (actual > expected) return "extra";
    return "mismatch";
  }

  return { collectStatusFromCounts };
})();

window.PhotoReviewAutoReview = (() => {
  function isMinusCandidate(result) {
    return Boolean(result && !result.orderProtected && Array.isArray(result.reasons) && result.reasons.length);
  }

  return { isMinusCandidate };
})();

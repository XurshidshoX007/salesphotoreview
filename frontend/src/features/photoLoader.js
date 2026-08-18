window.PhotoReviewPhotoLoader = (() => {
  function frameOf(img) {
    return img?.closest?.(".photoFrame") || img?.parentElement || null;
  }

  function setState(img, name) {
    const frame = frameOf(img);
    if (!frame) return;
    frame.classList.toggle("loaded", name === "loaded");
    frame.classList.toggle("broken", name === "broken");
    frame.hidden = false;
  }

  function proxyUrl(url, variant) {
    return `/api/photo?view=${encodeURIComponent(variant || "full")}&url=${encodeURIComponent(url)}`;
  }

  function applySource(img, src, mode, variant) {
    img.dataset.mode = mode;
    img.dataset.variant = variant || "full";
    img.referrerPolicy = "no-referrer";
    img.src = src;
  }

  function imageLoaded(img) {
    img.dataset.failed = "";
    setState(img, "loaded");
  }

  function imageError(img) {
    const url = img.dataset.sourceUrl || "";
    const variant = img.dataset.variant || "full";
    if (img.dataset.mode === "proxy" && url) {
      applySource(img, url, "direct", variant);
      return;
    }
    img.dataset.failed = "1";
    setState(img, "broken");
  }

  function load(img, url, mode = "proxy", variant = "full") {
    if (!img) return;
    img.dataset.sourceUrl = String(url || "");
    img.onload = () => imageLoaded(img);
    img.onerror = () => imageError(img);
    const frame = frameOf(img);
    if (frame) {
      frame.classList.remove("loaded", "broken");
      frame.hidden = false;
    }
    if (!url) {
      imageError(img);
      return;
    }
    if (mode === "direct") {
      applySource(img, url, "direct", variant);
      return;
    }
    applySource(img, proxyUrl(url, variant), "proxy", variant);
  }

  return { load, imageLoaded, imageError, proxyUrl };
})();

(function initPhotoLoader(global) {
  'use strict';

  const timers = new WeakMap();
  const timeoutMs = 12000;

  function proxyUrl(url, variant = 'full') {
    const params = new URLSearchParams({ url: String(url || '') });
    if (variant === 'thumb') params.set('view', 'thumb');
    return `/api/photo?${params.toString()}`;
  }

  function isPublicView() {
    const host = location.hostname;
    return Boolean(host && host !== '127.0.0.1' && host !== 'localhost' && host !== '::1');
  }

  function initialMode(variant = 'full') {
    return variant === 'thumb' ? 'proxy' : (isPublicView() ? 'direct' : 'proxy');
  }

  function displayUrl(url, mode = initialMode(), variant = 'full') {
    const clean = String(url || '').trim();
    return mode === 'direct' ? clean : proxyUrl(clean, variant);
  }

  function frameFor(img) {
    return img?.closest?.('.photoFrame') || null;
  }

  function clearTimer(img) {
    const timer = timers.get(img);
    if (timer) clearTimeout(timer);
    timers.delete(img);
  }

  function setState(img, state = 'loading', message = 'Rasm yuklanmoqda...') {
    const frame = frameFor(img);
    if (!frame) return;
    frame.classList.remove('loading', 'loaded', 'slow', 'broken');
    frame.classList.add(state);
    frame.dataset.status = message;
  }

  function imageLoaded(img) {
    clearTimer(img);
    if (img.naturalWidth === 0) return imageError(img);
    setState(img, 'loaded', '');
  }

  function load(img, url, mode = 'proxy', variant = 'full') {
    const direct = String(url || img?.dataset?.direct || '').trim();
    if (!img || !direct) return;
    clearTimer(img);
    img.dataset.direct = direct;
    img.dataset.mode = mode;
    img.dataset.variant = variant;
    if (mode === 'direct') img.dataset.triedDirect = '1';
    if (mode === 'proxy') img.dataset.triedProxy = '1';
    setState(img, mode === 'direct' ? 'slow' : 'loading', mode === 'direct' ? "Proxy sekin, to'g'ridan urinmoqda..." : 'Rasm yuklanmoqda...');
    img.src = displayUrl(direct, mode, variant);
    startWatchdog(img);
  }

  function startWatchdog(img) {
    clearTimer(img);
    const timer = setTimeout(() => {
      if (img.complete && img.naturalWidth > 0) return imageLoaded(img);
      const mode = img.dataset.mode || 'proxy';
      const direct = img.dataset.direct || '';
      if (mode === 'proxy' && direct && img.dataset.triedDirect !== '1') {
        setState(img, 'slow', "Proxy sekin, to'g'ridan urinmoqda...");
        return load(img, direct, 'direct', img.dataset.variant || 'full');
      }
      if (mode === 'direct' && direct && img.dataset.triedProxy !== '1') {
        setState(img, 'slow', 'Direct sekin, proxy orqali urinmoqda...');
        return load(img, direct, 'proxy', img.dataset.variant || 'full');
      }
      setState(img, 'broken', 'Rasm yuklanmadi - qayta yuklang');
      img.removeAttribute('src');
    }, timeoutMs);
    timers.set(img, timer);
  }

  function imageError(img) {
    const direct = img.dataset.direct || '';
    const mode = img.dataset.mode || 'proxy';
    clearTimer(img);
    if (mode === 'proxy' && direct && img.dataset.triedDirect !== '1') {
      setState(img, 'slow', "Proxy sekin, to'g'ridan urinmoqda...");
      return load(img, direct, 'direct', img.dataset.variant || 'full');
    }
    if (mode === 'direct' && direct && img.dataset.triedProxy !== '1') {
      setState(img, 'slow', 'Direct ochilmadi, proxy orqali urinmoqda...');
      return load(img, direct, 'proxy', img.dataset.variant || 'full');
    }
    setState(img, 'broken', 'Rasm yuklanmadi - qayta yuklang');
  }

  function retry(target) {
    const frame = target?.closest?.('.photoFrame') || target;
    const img = frame?.querySelector?.('img') || target;
    const direct = img?.dataset?.direct || '';
    if (!direct) return;
    delete img.dataset.triedDirect;
    delete img.dataset.triedProxy;
    load(img, direct, initialMode(img.dataset.variant || 'full'), img.dataset.variant || 'full');
  }

  global.PhotoReviewPhotoLoader = { proxyUrl, isPublicView, initialMode, displayUrl, load, retry, imageError, imageLoaded };
})(window);

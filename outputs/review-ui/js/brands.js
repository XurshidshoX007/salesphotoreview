window.PhotoReviewBrands = (() => {
  const byId = (config, id) => (config?.brands || []).find((brand) => brand.id === id) || null;
  const byCode = (config, code) => {
    const value = String(code || "").toUpperCase();
    return (config?.brands || []).find((brand) => (brand.agentPrefixes || []).some((prefix) => value.startsWith(String(prefix).toUpperCase()))) || null;
  };
  const displayName = (brand) => brand?.name || brand?.code || brand?.id || "";
  function slug(name, prefixes = []) {
    const base = String(name || prefixes[0] || "brand").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return base || `brand_${Date.now().toString(36)}`;
  }
  return { byId, byCode, displayName, slug };
})();

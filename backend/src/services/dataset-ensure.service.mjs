import { readFile } from "node:fs/promises";
import { basename, join, normalize, resolve } from "node:path";

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function datasetError(code, message, status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

export function normalizeDatasetDate(value) {
  return String(value || "").match(/\d{4}-\d{2}-\d{2}/)?.[0] || "";
}

export function isValidDatasetDate(value) {
  const match = String(value || "").match(ISO_DATE_RE);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

function key(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function brandAliases(brand) {
  return [
    brand?.id,
    brand?.name,
    brand?.code,
    brand?.filePrefix,
    ...(brand?.salesBrandNames || []),
    ...(brand?.agentPrefixes || []),
  ].map(key).filter(Boolean);
}

function resolveBrand(brands, value) {
  const wanted = key(value);
  if (!wanted) return null;
  return brands.find((brand) => brandAliases(brand).includes(wanted)) || null;
}

function filenameBrand(brands, file) {
  const name = basename(String(file || "")).toLowerCase();
  const matches = brands.filter((brand) => {
    const prefixes = [
      brand.filePrefix,
      brand.id,
      ...(brand.agentPrefixes || []),
    ].map((item) => String(item || "").toLowerCase().replace(/[^a-z0-9]+/g, "_")).filter(Boolean);
    return prefixes.some((prefix) => name.startsWith(`${prefix}_`));
  });
  return matches.length === 1 ? matches[0] : null;
}

function suffixBrand(brands, value) {
  const suffix = String(value || "").match(/\[([A-Za-z0-9_-]+)\]\s*$/)?.[1];
  return suffix ? resolveBrand(brands, suffix) : null;
}

export function manifestEntryBrand(brands, entry) {
  const raw = entry?.brand;
  const explicitValues = typeof raw === "string"
    ? [raw]
    : [raw?.id, raw?.code, raw?.name, raw?.filePrefix];
  const explicit = explicitValues.map((value) => resolveBrand(brands, value)).filter(Boolean);
  const explicitIds = [...new Set(explicit.map((brand) => brand.id))];
  if (explicitIds.length > 1) return null;
  if (explicitIds.length === 1) return explicit[0];

  const inferred = [
    suffixBrand(brands, entry?.date),
    filenameBrand(brands, entry?.file),
  ].filter(Boolean);
  const inferredIds = [...new Set(inferred.map((brand) => brand.id))];
  return inferredIds.length === 1 ? inferred[0] : null;
}

function agentCode(agent) {
  return String(agent?.code || agent?.agentCode || agent?.agent_code || "").toUpperCase();
}

function datasetMatchesBrand(brands, dataset, requestedBrand, file) {
  const raw = dataset?.brand;
  const explicitValues = typeof raw === "string"
    ? [raw]
    : [raw?.id, raw?.code, raw?.name, raw?.filePrefix];
  const explicit = explicitValues.map((value) => resolveBrand(brands, value)).find(Boolean);
  if (explicit) return explicit.id === requestedBrand.id;

  const inferred = filenameBrand(brands, file);
  if (inferred) return inferred.id === requestedBrand.id;

  const rows = Array.isArray(dataset?.agents) ? dataset.agents : dataset?.rows;
  const codes = (Array.isArray(rows) ? rows : []).map(agentCode).filter(Boolean);
  if (!codes.length || !requestedBrand.agentPrefixes?.length) return false;
  const matched = codes.filter((code) => requestedBrand.agentPrefixes.some((prefix) => code.startsWith(String(prefix).toUpperCase()))).length;
  return matched / codes.length >= 0.8;
}

function datasetQuality(dataset) {
  const agents = Array.isArray(dataset?.agents) ? dataset.agents : (Array.isArray(dataset?.rows) ? dataset.rows : []);
  const derived = { ok: 0, partial: 0, error: 0, empty: 0, extra: 0, mismatch: 0, unknown: 0 };
  for (const agent of agents) {
    const status = String(agent?.status || "ok").toLowerCase();
    if (Object.hasOwn(derived, status)) derived[status] += 1;
    else derived.unknown += 1;
  }
  const stats = { ...derived, ...(dataset?.stats || {}) };
  const expectedPhotos = agents.reduce((sum, agent) => sum + Number(agent?.expectedPhotos || 0), 0);
  const actualPhotos = agents.reduce((sum, agent) => sum + Number(agent?.actualUrls ?? agent?.urls?.length ?? 0), 0);
  const partial = ["partial", "error", "empty", "extra", "mismatch", "unknown"]
    .some((name) => Number(stats[name] || 0) > 0);
  return {
    status: partial ? "partial" : "ready",
    summary: {
      totalAgents: Number(dataset?.totalAgents ?? agents.length),
      agentsWithPhotos: Number(dataset?.totalAgentsWithPhotos ?? agents.filter((agent) => Number(agent?.actualUrls ?? agent?.urls?.length ?? 0) > 0).length),
      totalPhotos: actualPhotos,
      expectedPhotos,
      actualPhotos,
      ok: Number(stats.ok || 0),
      partial: Number(stats.partial || 0),
      error: Number(stats.error || 0),
      empty: Number(stats.empty || 0),
      extra: Number(stats.extra || 0),
      mismatch: Number(stats.mismatch || 0),
      unknown: Number(stats.unknown || 0),
    },
  };
}

function safeDatasetPath(outputsDir, file) {
  const raw = String(file || "").replaceAll("\\", "/");
  if (!raw || raw.includes("\0") || raw.startsWith("/") || /^[A-Za-z]:/.test(raw)) return null;
  const target = normalize(resolve(outputsDir, raw));
  const root = normalize(resolve(outputsDir));
  return target === root || target.startsWith(`${root}\\`) || target.startsWith(`${root}/`) ? target : null;
}

export function createDatasetEnsureService({
  outputsDir,
  manifestFile = join(outputsDir, "lmj_review_datasets.json"),
  loadBrands,
  publicCollectState,
  startCollectJob,
}) {
  let startLock = Promise.resolve();

  async function brands() {
    const config = await loadBrands();
    return (config?.brands || []).filter((brand) => brand.enabled !== false).map((brand) => ({
      ...brand,
      code: brand.code || brand.agentPrefixes?.[0] || "",
      filePrefix: brand.filePrefix || brand.id,
    }));
  }

  async function requestIdentity(date, brandValue) {
    if (!isValidDatasetDate(date)) throw datasetError("INVALID_DATE", "Sana noto'g'ri. Format: YYYY-MM-DD", 400);
    const available = await brands();
    const brand = resolveBrand(available, brandValue);
    if (!brand) throw datasetError("INVALID_BRAND", "Brend topilmadi yoki faol emas", 400);
    return { date, brand, brands: available, jobKey: `${brand.id}:${date}` };
  }

  async function findReady(identity) {
    let manifest;
    try {
      manifest = JSON.parse(await readFile(manifestFile, "utf8"));
    } catch {
      return null;
    }
    const matches = (Array.isArray(manifest?.datasets) ? manifest.datasets : [])
      .filter((entry) => normalizeDatasetDate(entry?.date) === identity.date)
      .filter((entry) => manifestEntryBrand(identity.brands, entry)?.id === identity.brand.id)
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

    for (const entry of matches) {
      const filePath = safeDatasetPath(outputsDir, entry.file);
      if (!filePath) continue;
      try {
        const dataset = JSON.parse(await readFile(filePath, "utf8"));
        const rows = Array.isArray(dataset?.agents) ? dataset.agents : dataset?.rows;
        if (!dataset || typeof dataset !== "object" || !Array.isArray(rows)) continue;
        if (normalizeDatasetDate(dataset.date) !== identity.date) continue;
        if (!datasetMatchesBrand(identity.brands, dataset, identity.brand, entry.file)) continue;
        const quality = datasetQuality(dataset);
        return {
          ok: true,
          status: quality.status,
          date: identity.date,
          brand: identity.brand.id,
          jobKey: identity.jobKey,
          dataset: {
            file: String(entry.file).replaceAll("\\", "/"),
            updatedAt: entry.updatedAt || dataset.collectedAt || "",
          },
          summary: quality.summary,
        };
      } catch {
        // A broken manifest entry is ignored; an older valid entry may still exist.
      }
    }
    return null;
  }

  function activeIdentity(state, available) {
    const brand = resolveBrand(available, state?.brandId || state?.brand);
    const date = normalizeDatasetDate(state?.date);
    return brand && date ? { brand, date, jobKey: `${brand.id}:${date}` } : null;
  }

  function collectingResponse(identity, state) {
    return {
      ok: true,
      status: "collecting",
      date: identity.date,
      brand: identity.brand.id,
      jobKey: identity.jobKey,
      progress: state?.progress || null,
      summary: state?.summary || null,
    };
  }

  function busyResponse(identity, state, active) {
    return {
      ok: true,
      status: "busy",
      date: identity.date,
      brand: identity.brand.id,
      jobKey: identity.jobKey,
      active: active ? {
        date: active.date,
        brand: active.brand.id,
        jobKey: active.jobKey,
        progress: state?.progress || null,
      } : null,
    };
  }

  function failedResponse(identity, state) {
    return {
      ok: false,
      status: "error",
      date: identity.date,
      brand: identity.brand.id,
      jobKey: identity.jobKey,
      code: state?.error?.code || "COLLECT_PROCESS_FAILED",
      error: state?.error?.message || "Ma'lumotni tayyorlab bo'lmadi",
    };
  }

  async function inspect(identity, { includeTerminal = true } = {}) {
    const ready = await findReady(identity);
    if (ready) return ready;
    const state = publicCollectState();
    const active = activeIdentity(state, identity.brands);
    if (state?.running) {
      return active?.jobKey === identity.jobKey
        ? collectingResponse(identity, state)
        : busyResponse(identity, state, active);
    }
    if (includeTerminal && active?.jobKey === identity.jobKey && ["error", "failed"].includes(state?.status)) {
      return failedResponse(identity, state);
    }
    if (includeTerminal && active?.jobKey === identity.jobKey && ["done", "partial"].includes(state?.status)) {
      return {
        ok: false,
        status: "error",
        date: identity.date,
        brand: identity.brand.id,
        jobKey: identity.jobKey,
        code: "DATASET_INVALID",
        error: "Yig'ish tugadi, lekin dataset tekshiruvdan o'tmadi",
      };
    }
    return null;
  }

  function classifyStartError(error) {
    if (error?.code) return error;
    const message = String(error?.message || "");
    if (/credential|login.*parol|COLLECT_LOGIN|SALES_LOGIN|SALES_PASSWORD/i.test(message)) {
      return datasetError("SALES_CREDENTIALS_MISSING", "Sales login yoki paroli sozlanmagan", 503);
    }
    if (/ENOENT|spawn|ishga tush|process/i.test(message)) {
      return datasetError("COLLECT_PROCESS_FAILED", "Ma'lumot yig'ish jarayonini ishga tushirib bo'lmadi", 500);
    }
    return datasetError("COLLECT_PROCESS_FAILED", "Ma'lumot yig'ish jarayonini ishga tushirib bo'lmadi", 500);
  }

  async function withStartLock(callback) {
    const previous = startLock;
    let release;
    startLock = new Promise((resolveLock) => { release = resolveLock; });
    await previous;
    try {
      return await callback();
    } finally {
      release();
    }
  }

  return Object.freeze({
    async ensure({ date, brand }) {
      const identity = await requestIdentity(date, brand);
      const current = await inspect(identity, { includeTerminal: false });
      if (current) return current;
      return withStartLock(async () => {
        const rechecked = await inspect(identity, { includeTerminal: false });
        if (rechecked) return rechecked;
        try {
          await startCollectJob({ date: identity.date, brand: identity.brand.id, browserHint: "" });
        } catch (error) {
          if (Number(error?.status) === 409) {
            const state = publicCollectState();
            const active = activeIdentity(state, identity.brands);
            return active?.jobKey === identity.jobKey
              ? collectingResponse(identity, state)
              : busyResponse(identity, state, active);
          }
          throw classifyStartError(error);
        }
        return collectingResponse(identity, publicCollectState());
      });
    },

    async status({ date, brand }) {
      const identity = await requestIdentity(date, brand);
      return (await inspect(identity)) || {
        ok: false,
        status: "error",
        date: identity.date,
        brand: identity.brand.id,
        jobKey: identity.jobKey,
        code: "DATASET_INVALID",
        error: "Dataset topilmadi",
      };
    },

    findReady: async ({ date, brand }) => findReady(await requestIdentity(date, brand)),
  });
}

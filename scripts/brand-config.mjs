import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { queueJsonWrite, readJsonResilient } from "../backend/src/services/json-storage.service.mjs";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Railway'da brendlar Volume'da saqlanadi; lokalda ROOT bilan bir xil.
const DATA_ROOT = process.env.DATA_DIR ? resolve(process.env.DATA_DIR) : ROOT;
export const BRANDS_FILE = join(DATA_ROOT, "config", "brands.json");
export const BRAND_BACKUP_DIR = join(DATA_ROOT, "config", "backups");
// Image ichidagi asl (seed uchun) — Volume bo'sh bo'lsa shundan ko'chiriladi.
export const BRANDS_SEED_FILE = join(ROOT, "config", "brands.json");

export const DEFAULT_BRANDS_CONFIG = {
  brands: [
    {
      id: "sof",
      name: "SOF",
      salesBrandNames: ["SOF", "Sof"],
      agentPrefixes: ["JY"],
      telegramChatId: "",
      telegramChatName: "",
      enabled: true,
      notes: "SOF agentlari odatda JY bilan boshlanadi",
    },
    {
      id: "lalaku_mama",
      name: "Lalaku Mama",
      salesBrandNames: ["Lalaku mama", "LALAKU MAMA", "Mama"],
      agentPrefixes: ["LMJ"],
      telegramChatId: "",
      telegramChatName: "",
      enabled: true,
      notes: "Lalaku Mama agentlari odatda LMJ bilan boshlanadi",
    },
  ],
};

export function normalizeBrandKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function cleanArray(value) {
  return Array.isArray(value)
    ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))]
    : [];
}

export function normalizeBrand(brand) {
  const id = String(brand?.id || "").trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  const agentPrefixes = cleanArray(brand?.agentPrefixes).map((prefix) => prefix.toUpperCase());
  return {
    id,
    name: String(brand?.name || "").trim(),
    salesBrandNames: cleanArray(brand?.salesBrandNames),
    agentPrefixes,
    telegramChatId: String(brand?.telegramChatId || "").trim(),
    telegramChatName: String(brand?.telegramChatName || "").trim(),
    enabled: typeof brand?.enabled === "boolean" ? brand.enabled : true,
    notes: String(brand?.notes || "").trim(),
  };
}

export function validateBrandsConfig(config) {
  const errors = [];
  const warnings = [];
  if (!config || typeof config !== "object" || !Array.isArray(config.brands)) {
    errors.push("brands array topilmadi");
    return { ok: false, errors, warnings, brands: [] };
  }

  const ids = new Map();
  const prefixes = new Map();
  const brands = config.brands.map(normalizeBrand);
  for (const brand of brands) {
    if (!brand.id) errors.push("Brend id bo'sh bo'lmasin");
    if (!brand.name) errors.push(`Brend nomi bo'sh: ${brand.id || "(id yo'q)"}`);
    if (!Array.isArray(brand.salesBrandNames)) errors.push(`${brand.id}: salesBrandNames array bo'lishi kerak`);
    if (!Array.isArray(brand.agentPrefixes)) errors.push(`${brand.id}: agentPrefixes array bo'lishi kerak`);
    if (typeof brand.enabled !== "boolean") errors.push(`${brand.id}: enabled boolean bo'lishi kerak`);
    if (!brand.agentPrefixes.length) warnings.push(`${brand.name || brand.id}: agent prefix kiritilmagan. Agentlarni filterlash imkonsiz.`);

    if (brand.id) {
      if (ids.has(brand.id)) errors.push(`Takrorlangan brend id: ${brand.id}`);
      ids.set(brand.id, brand);
    }
    for (const prefix of brand.agentPrefixes) {
      if (!prefix) errors.push(`${brand.id}: bo'sh prefix bor`);
      const list = prefixes.get(prefix) || [];
      list.push(brand.name || brand.id);
      prefixes.set(prefix, list);
    }
  }

  for (const [prefix, names] of prefixes) {
    if (names.length > 1) warnings.push(`Prefix "${prefix}" bir nechta brendda ishlatilgan: ${names.join(", ")}`);
  }

  return { ok: errors.length === 0, errors, warnings, brands };
}

export async function ensureBrandsConfig() {
  if (existsSync(BRANDS_FILE)) return;
  await mkdir(dirname(BRANDS_FILE), { recursive: true });
  await writeFile(BRANDS_FILE, `${JSON.stringify(DEFAULT_BRANDS_CONFIG, null, 2)}\n`, "utf8");
}

export async function loadBrandsConfig({ includeDisabled = true } = {}) {
  await ensureBrandsConfig();
  const config = await readJsonResilient(BRANDS_FILE, DEFAULT_BRANDS_CONFIG, {
    validate: (value) => validateBrandsConfig(value).ok,
  });
  const validation = validateBrandsConfig(config);
  if (!validation.ok) {
    throw new Error(`Brand config xato: ${validation.errors.join("; ")}`);
  }
  const brands = includeDisabled ? validation.brands : validation.brands.filter((brand) => brand.enabled);
  return { brands, warnings: validation.warnings };
}

export function findBrand(configOrBrands, value, { includeDisabled = false } = {}) {
  const brands = Array.isArray(configOrBrands) ? configOrBrands : (configOrBrands?.brands || []);
  const key = normalizeBrandKey(value);
  if (!key) return null;
  return brands.find((brand) => {
    if (!includeDisabled && brand.enabled === false) return false;
    const keys = [
      brand.id,
      brand.name,
      ...(brand.salesBrandNames || []),
      ...(brand.agentPrefixes || []),
    ].map(normalizeBrandKey);
    return keys.includes(key);
  }) || null;
}

export function isAgentAllowed(agentCode, brand) {
  const code = String(agentCode || "").toUpperCase();
  const prefixes = cleanArray(brand?.agentPrefixes).map((prefix) => prefix.toUpperCase());
  if (!prefixes.length) return false;
  return prefixes.some((prefix) => code.startsWith(prefix));
}

export function publicBrand(brand) {
  const normalized = normalizeBrand(brand);
  return {
    ...normalized,
    code: normalized.agentPrefixes[0] || normalized.id.toUpperCase(),
    filePrefix: normalized.id.replace(/[^a-z0-9]+/g, "_"),
  };
}

export async function saveBrandsConfig(nextConfig) {
  const validation = validateBrandsConfig(nextConfig);
  if (!validation.ok) {
    const error = new Error(`Brand config saqlanmadi: ${validation.errors.join("; ")}`);
    error.validation = validation;
    throw error;
  }

  await queueJsonWrite(BRANDS_FILE, { brands: validation.brands }, {
    validate: (value) => validateBrandsConfig(value).ok,
  });
  return { brands: validation.brands, warnings: validation.warnings };
}

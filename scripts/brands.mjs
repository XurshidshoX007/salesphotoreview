import { loadBrandsConfig, saveBrandsConfig, validateBrandsConfig, findBrand, normalizeBrand, DEFAULT_BRANDS_CONFIG } from "./brand-config.mjs";

function printValidation(validation) {
  if (validation.errors.length) {
    console.log("Errors:");
    validation.errors.forEach((error) => console.log(`- ${error}`));
  }
  if (validation.warnings.length) {
    console.log("Warnings:");
    validation.warnings.forEach((warning) => console.log(`- ${warning}`));
  }
}

function parseFlags(args) {
  const flags = {};
  const rest = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith("--")) {
      rest.push(arg);
      continue;
    }
    const [rawKey, inlineValue] = arg.slice(2).split("=", 2);
    const key = rawKey.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    if (inlineValue !== undefined) flags[key] = inlineValue;
    else if (args[i + 1] && !args[i + 1].startsWith("--")) flags[key] = args[++i];
    else flags[key] = true;
  }
  return { flags, rest };
}

async function list() {
  const { brands, warnings } = await loadBrandsConfig({ includeDisabled: true });
  console.log("Active brands:\n");
  brands.filter((brand) => brand.enabled).forEach((brand, index) => {
    console.log(`${index + 1}. ${brand.name}`);
    console.log(`   ID: ${brand.id}`);
    console.log(`   Sales names: ${(brand.salesBrandNames || []).join(", ") || "-"}`);
    console.log(`   Agent prefixes: ${(brand.agentPrefixes || []).join(", ") || "-"}`);
    if (brand.notes) console.log(`   Notes: ${brand.notes}`);
    console.log("");
  });
  const disabled = brands.filter((brand) => !brand.enabled);
  if (disabled.length) {
    console.log("Disabled brands:");
    disabled.forEach((brand) => console.log(`- ${brand.name} (${brand.id})`));
    console.log("");
  }
  if (warnings.length) {
    console.log("Warnings:");
    warnings.forEach((warning) => console.log(`- ${warning}`));
  }
}

async function validate() {
  const config = await loadBrandsConfig({ includeDisabled: true });
  const validation = validateBrandsConfig(config);
  printValidation(validation);
  if (!validation.ok) process.exit(1);
  console.log("Brand config OK");
}

async function add(args) {
  const { flags, rest } = parseFlags(args);
  const [posId, posName, posSalesNames = "", posPrefixes = "", ...notesParts] = rest;
  const id = flags.id || posId;
  const name = flags.name || posName;
  const salesNames = flags.sales || flags.salesBrandNames || posSalesNames;
  const prefixes = flags.prefix || flags.prefixes || flags.agentPrefixes || posPrefixes;
  const notes = flags.notes || notesParts.join(" ");
  if (!id || !name) {
    console.log("Usage: node scripts/brands.mjs add <id> <name> [sales names comma] [prefixes comma] [notes]");
    console.log("   or: node scripts/brands.mjs add --id <id> --name <name> --sales <names> --prefix <prefixes> [--notes <notes>]");
    process.exit(1);
  }
  const config = await loadBrandsConfig({ includeDisabled: true });
  if (findBrand(config, id, { includeDisabled: true })) {
    console.error(`Brend allaqachon bor: ${id}`);
    process.exit(1);
  }
  config.brands.push(normalizeBrand({
    id,
    name,
    salesBrandNames: salesNames ? salesNames.split(",") : [name],
    agentPrefixes: prefixes ? prefixes.split(",") : [],
    enabled: true,
    notes,
  }));
  const saved = await saveBrandsConfig(config);
  console.log(`Qo'shildi: ${name}`);
  printValidation({ errors: [], warnings: saved.warnings });
}

async function edit(args) {
  const { flags, rest } = parseFlags(args);
  const [posId, posField, ...valueParts] = rest;
  const id = flags.id || posId;
  if (!id) {
    console.log("Usage: node scripts/brands.mjs edit <id> <name|salesBrandNames|agentPrefixes|enabled|notes> <value>");
    console.log("   or: node scripts/brands.mjs edit --id <id> --name <name> --prefix <prefixes> --sales <names> --enabled true");
    process.exit(1);
  }
  const config = await loadBrandsConfig({ includeDisabled: true });
  const brand = findBrand(config, id, { includeDisabled: true });
  if (!brand) {
    console.error(`Brend topilmadi: ${id}`);
    process.exit(1);
  }
  if (Object.keys(flags).some((key) => key !== "id")) {
    if (flags.name !== undefined) brand.name = String(flags.name);
    if (flags.sales !== undefined || flags.salesBrandNames !== undefined) {
      brand.salesBrandNames = String(flags.sales ?? flags.salesBrandNames).split(",").map((item) => item.trim()).filter(Boolean);
    }
    if (flags.prefix !== undefined || flags.prefixes !== undefined || flags.agentPrefixes !== undefined) {
      brand.agentPrefixes = String(flags.prefix ?? flags.prefixes ?? flags.agentPrefixes).split(",").map((item) => item.trim()).filter(Boolean);
    }
    if (flags.enabled !== undefined) brand.enabled = /^(1|true|yes|ha)$/i.test(String(flags.enabled));
    if (flags.notes !== undefined) brand.notes = String(flags.notes);
  } else {
    const field = posField;
    const value = valueParts.join(" ");
    if (!field) {
      console.log("Usage: node scripts/brands.mjs edit <id> <name|salesBrandNames|agentPrefixes|enabled|notes> <value>");
      process.exit(1);
    }
    if (field === "salesBrandNames" || field === "agentPrefixes") brand[field] = value.split(",").map((item) => item.trim()).filter(Boolean);
    else if (field === "enabled") brand.enabled = /^(1|true|yes|ha)$/i.test(value);
    else if (["name", "notes"].includes(field)) brand[field] = value;
    else {
      console.error(`Maydon noto'g'ri: ${field}`);
      process.exit(1);
    }
  }
  const saved = await saveBrandsConfig(config);
  console.log(`Yangilandi: ${brand.name}`);
  printValidation({ errors: [], warnings: saved.warnings });
}

async function migrate() {
  const saved = await saveBrandsConfig(DEFAULT_BRANDS_CONFIG);
  console.log("Default SOF/JY va Lalaku Mama/LMJ config yozildi.");
  printValidation({ errors: [], warnings: saved.warnings });
}

const [command = "list", ...args] = process.argv.slice(2);
try {
  if (command === "list") await list();
  else if (command === "validate") await validate();
  else if (command === "add") await add(args);
  else if (command === "edit") await edit(args);
  else if (command === "migrate") await migrate();
  else {
    console.log("Commands: list | validate | add | edit | migrate");
    process.exit(1);
  }
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}

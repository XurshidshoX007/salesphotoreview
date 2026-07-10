import assert from "node:assert/strict";
import { DEFAULT_BRANDS_CONFIG, findBrand, isAgentAllowed, validateBrandsConfig } from "./brand-config.mjs";

const validation = validateBrandsConfig(DEFAULT_BRANDS_CONFIG);
assert.equal(validation.ok, true);

const sof = findBrand(DEFAULT_BRANDS_CONFIG, "sof");
assert.equal(sof.name, "SOF");
assert.equal(isAgentAllowed("JY001", sof), true);
assert.equal(isAgentAllowed("LMJ001", sof), false);

const lalaku = findBrand(DEFAULT_BRANDS_CONFIG, "Lalaku mama");
assert.equal(lalaku.id, "lalaku_mama");
assert.equal(isAgentAllowed("LMJAN01", lalaku), true);

const customConfig = {
  brands: [
    ...DEFAULT_BRANDS_CONFIG.brands,
    { id: "texnika", name: "Texnika", salesBrandNames: ["TEXNIKA"], agentPrefixes: ["TB", "TXB"], enabled: true },
  ],
};
const custom = findBrand(customConfig, "TEXNIKA");
assert.equal(isAgentAllowed("TXB77", custom), true);

assert.equal(findBrand(DEFAULT_BRANDS_CONFIG, "unknown_brand"), null);

const duplicate = validateBrandsConfig({
  brands: [
    { id: "a", name: "A", salesBrandNames: ["A"], agentPrefixes: ["AA"], enabled: true },
    { id: "b", name: "B", salesBrandNames: ["B"], agentPrefixes: ["AA"], enabled: true },
  ],
});
assert.equal(duplicate.ok, true);
assert.equal(duplicate.warnings.some((warning) => warning.includes('Prefix "AA"')), true);

console.log("Brand tests OK");

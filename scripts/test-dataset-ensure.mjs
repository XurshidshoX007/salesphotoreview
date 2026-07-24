import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createDatasetEnsureService } from "../backend/src/services/dataset-ensure.service.mjs";

const root = await mkdtemp(join(tmpdir(), "dataset-ensure-"));
const outputsDir = join(root, "outputs");
const manifestFile = join(outputsDir, "lmj_review_datasets.json");
await mkdir(outputsDir, { recursive: true });

const brands = [
  { id: "sof", name: "SOF", agentPrefixes: ["JY"], filePrefix: "sof", enabled: true },
  { id: "lalaku_mama", name: "Lalaku Mama", agentPrefixes: ["LMJ"], filePrefix: "lalaku_mama", enabled: true },
];
let collect = { running: false, status: "idle" };
let starts = 0;

async function writeDataset(file, { date, brand, status = "ok" }) {
  await writeFile(join(outputsDir, file), JSON.stringify({
    date,
    brand,
    totalAgents: 1,
    totalAgentsWithPhotos: 1,
    stats: { ok: status === "ok" ? 1 : 0, partial: status === "partial" ? 1 : 0 },
    agents: [{ code: brand === "sof" || brand?.id === "sof" ? "JY001" : "LMJ001", status, expectedPhotos: 1, actualUrls: 1, urls: ["x"] }],
  }));
}

async function writeManifest(datasets) {
  await writeFile(manifestFile, JSON.stringify({ datasets }));
}

const service = createDatasetEnsureService({
  outputsDir,
  manifestFile,
  loadBrands: async () => ({ brands }),
  publicCollectState: () => ({ ...collect }),
  startCollectJob: async ({ date, brand }) => {
    starts += 1;
    await new Promise((resolve) => setTimeout(resolve, 5));
    collect = { running: true, status: "collecting", date, brand, brandId: brand, jobKey: `${brand}:${date}`, progress: { completed: 0, total: 2, percent: 0 } };
  },
});

await writeDataset("sof_ready.json", { date: "2026-07-20", brand: "sof" });
await writeManifest([{ date: "2026-07-20 [JY]", file: "sof_ready.json", brand: { code: "JY", name: "SOF" }, updatedAt: "2026-07-20T10:00:00Z" }]);
assert.equal((await service.ensure({ date: "2026-07-20", brand: "sof" })).status, "ready", "legacy object/JY entry ready");
assert.equal(starts, 0, "existing dataset must not collect");

await writeDataset("mama_ready.json", { date: "2026-07-21", brand: "lalaku_mama" });
await writeManifest([{ date: "2026-07-21", file: "mama_ready.json", brand: "lalaku_mama" }]);
assert.equal((await service.ensure({ date: "2026-07-21", brand: "lalaku_mama" })).status, "ready", "string brand ready");

await writeDataset("lmj_legacy.json", { date: "2026-07-22", brand: null });
await writeManifest([{ date: "2026-07-22", file: "lmj_legacy.json" }]);
assert.equal((await service.ensure({ date: "2026-07-22", brand: "lalaku_mama" })).status, "ready", "legacy missing brand inferred safely");

await writeManifest([{ date: "2026-07-23 [JY]", file: "missing.json", brand: "sof" }]);
collect = { running: false, status: "idle" };
starts = 0;
const repeated = await Promise.all(Array.from({ length: 5 }, () => service.ensure({ date: "2026-07-23", brand: "sof" })));
assert.equal(starts, 1, "five ensure requests start one process");
assert.ok(repeated.every((item) => item.status === "collecting"));

assert.equal((await service.ensure({ date: "2026-07-23", brand: "sof" })).status, "collecting", "same active job collecting");
assert.equal((await service.ensure({ date: "2026-07-24", brand: "lalaku_mama" })).status, "busy", "different active job busy");

await assert.rejects(() => service.ensure({ date: "24.07.2026", brand: "sof" }), (error) => error.code === "INVALID_DATE" && error.status === 400);
await assert.rejects(() => service.ensure({ date: "2026-07-24", brand: "missing" }), (error) => error.code === "INVALID_BRAND" && error.status === 400);

collect = { running: false, status: "idle" };
await writeDataset("sof_partial.json", { date: "2026-07-25", brand: { id: "sof" }, status: "partial" });
await writeManifest([{ date: "2026-07-25 [JY]", file: "sof_partial.json", brand: "sof" }]);
assert.equal((await service.status({ date: "2026-07-25", brand: "sof" })).status, "partial", "partial dataset remains visible");

collect = { running: false, status: "failed", date: "2026-07-26", brandId: "sof", error: { code: "SALES_TIMEOUT", message: "Vaqt tugadi" } };
await writeManifest([]);
const failed = await service.status({ date: "2026-07-26", brand: "sof" });
assert.equal(failed.status, "error");
assert.equal(failed.code, "SALES_TIMEOUT");
const startsBeforeRetry = starts;
assert.equal((await service.ensure({ date: "2026-07-26", brand: "sof" })).status, "collecting");
assert.equal(starts, startsBeforeRetry + 1, "failed job can be retried safely");

collect = { running: false, status: "done", date: "2026-07-27", brandId: "sof" };
const invalid = await service.status({ date: "2026-07-27", brand: "sof" });
assert.equal(invalid.code, "DATASET_INVALID");

console.log("Dataset ensure tests: OK");

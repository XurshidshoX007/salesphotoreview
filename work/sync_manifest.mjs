import { updateDatasetManifest, projectRoot } from "./lmj_sales_browser_collect.mjs";
import { join } from "node:path";

const root = projectRoot();
const manifestPath = join(root, "outputs", "lmj_review_datasets.json");

const datasets = [
  { date: "2026-05-30", file: "lmj_30may_all_agents_photos_raw.json" },
  { date: "2026-06-02", file: "lmj_browser_collect_2026-06-02_raw.json" },
];

for (const { date, file } of datasets) {
  await updateDatasetManifest(manifestPath, join(root, "outputs", file), date);
  console.log(`Manifest: ${date} -> ${file}`);
}

console.log("Tayyor:", manifestPath);

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../frontend/src/features/datasetAutoLoad.js", import.meta.url), "utf8");
const context = {
  window: {},
  URLSearchParams,
  AbortController,
  setTimeout,
  clearTimeout,
};
vm.runInNewContext(source, context);
const { create } = context.window.PhotoReviewDatasetAutoLoad;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

{
  const states = [];
  const controller = create({
    debounceMs: 1,
    isCurrent: () => true,
    onState: (state) => states.push(state.status),
    onReady: (state) => states.push(`open:${state.status}`),
    request: async () => ({ status: "ready", dataset: { file: "existing.json" } }),
  });
  controller.schedule({ date: "2026-07-24", brand: "sof" });
  await sleep(10);
  assert.deepEqual(states, ["checking", "ready", "open:ready"], "existing dataset opens immediately");
}

{
  const states = [];
  let calls = 0;
  const controller = create({
    debounceMs: 1,
    pollMs: 2,
    isCurrent: () => true,
    onState: (state) => states.push(state.status),
    onReady: (state) => states.push(`open:${state.status}`),
    request: async () => (++calls === 1
      ? { status: "collecting", progress: { completed: 1, total: 2, percent: 50 } }
      : { status: "ready", dataset: { file: "x.json" } }),
  });
  controller.schedule({ date: "2026-07-24", brand: "sof" });
  await sleep(40);
  assert.deepEqual(states.slice(0, 4), ["checking", "collecting", "ready", "open:ready"]);
}

{
  const states = [];
  let calls = 0;
  const controller = create({
    debounceMs: 1,
    pollMs: 2,
    isCurrent: () => true,
    onState: (state) => states.push(state.status),
    onReady: (state) => states.push(`open:${state.status}`),
    request: async () => (++calls === 1 ? { status: "busy" } : { status: "partial", summary: { partial: 1 } }),
  });
  controller.schedule({ date: "2026-07-24", brand: "sof" });
  await sleep(40);
  assert.ok(states.includes("busy"));
  assert.ok(states.includes("open:partial"));
}

{
  const states = [];
  const controller = create({
    debounceMs: 1,
    pollMs: 2,
    isCurrent: () => true,
    onState: (state) => states.push(state),
    request: async () => ({ status: "error", code: "SALES_LOGIN_FAILED" }),
  });
  controller.schedule({ date: "2026-07-24", brand: "sof" });
  await sleep(20);
  assert.equal(states.at(-1).status, "error");
  assert.match(states.at(-1).message, /login/i);
}

{
  const states = [];
  let calls = 0;
  const controller = create({
    debounceMs: 1,
    pollMs: 2,
    maxAutoRetries: 2,
    isCurrent: () => true,
    onState: (state) => states.push(state),
    request: async () => {
      calls += 1;
      throw new Error("socket reset");
    },
  });
  controller.schedule({ date: "2026-07-24", brand: "sof" });
  await sleep(80);
  assert.equal(calls, 3, "network failure retries are bounded");
  assert.equal(states.at(-1).status, "error");
  assert.equal(states.filter((state) => state.retrying).length, 2);
}

{
  let current = { date: "2026-07-24", brand: "sof" };
  const opened = [];
  const controller = create({
    debounceMs: 1,
    pollMs: 2,
    isCurrent: (selection) => selection.date === current.date && selection.brand === current.brand,
    onReady: (_, selection) => opened.push(selection.brand),
    request: async (_, options) => {
      const body = options.body ? JSON.parse(options.body) : current;
      await sleep(body.brand === "sof" ? 10 : 1);
      return { status: "ready" };
    },
  });
  controller.schedule(current);
  await sleep(2);
  current = { date: "2026-07-24", brand: "lalaku_mama" };
  controller.schedule(current);
  await sleep(20);
  assert.deepEqual(opened, ["lalaku_mama"], "stale response must not open old dataset");
}

console.log("Dataset auto-load tests: OK");

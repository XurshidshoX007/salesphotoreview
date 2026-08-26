import assert from "node:assert/strict";
import { createPostgresService } from "../backend/src/services/postgres.service.mjs";

const calls = [];
const fakePool = {
  async query(sql, values) {
    calls.push({ sql: String(sql), values });
    if (/count\(\*\)/.test(sql)) return { rows: [{ count: 2 }] };
    if (/document_key FROM/.test(sql)) return { rows: [{ document_key: "brands" }, { document_key: "review-reasons" }] };
    return { rows: [] };
  },
  async end() {},
};
const service = createPostgresService({ connectionString: "postgresql://test", poolFactory: () => fakePool });
await service.migrate();
await service.upsertReviewMarks({ one: { verdict: "MINUS" }, two: { verdict: "OK" } });
await service.saveDocument("brands", { brands: [] });
assert.equal((await service.mirrorSummary()).marks, 2);
assert(calls.some((call) => /INSERT INTO review_marks/.test(call.sql)), "Mark upsert yo'q");
assert(calls.some((call) => /INSERT INTO app_documents/.test(call.sql)), "Document upsert yo'q");
await service.close();
console.log("PostgreSQL service tests: OK");

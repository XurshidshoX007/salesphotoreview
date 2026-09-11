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

// Mirror bitta so'rovda ko'p yozuv yuborishi kerak. Ilgari har bir belgi
// alohida round-trip edi: 1200 ta belgi = 1200 ta so'rov.
const markInserts = () => calls.filter((call) => /INSERT INTO review_marks/.test(call.sql)).length;
const before = markInserts();
const bulk = Object.fromEntries(Array.from({ length: 1200 }, (_, index) => [`key-${index}`, { verdict: "MINUS" }]));
await service.upsertReviewMarks(bulk);
const queries = markInserts() - before;
assert(queries === 3, `1200 belgi ${queries} so'rovda yozildi (3 kutilgan edi)`);
const last = calls.at(-1);
assert(Array.isArray(last.values?.[0]) && Array.isArray(last.values?.[1]), "Bulk upsert massiv parametr ishlatmadi");
assert(last.values[0].length === last.values[1].length, "Kalit va payload massivlari uzunligi mos emas");

await service.close();
console.log(`PostgreSQL service tests: OK | 1200 belgi ${queries} so'rovda`);

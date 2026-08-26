import pg from "pg";

const { Pool } = pg;

function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} noto'g'ri`);
}

export function createPostgresService({ connectionString = process.env.DATABASE_URL, poolFactory = (config) => new Pool(config) } = {}) {
  const url = String(connectionString || "").trim();
  let pool = null;
  const enabled = () => Boolean(url);
  const client = () => {
    if (!enabled()) throw new Error("DATABASE_URL sozlanmagan");
    if (!pool) pool = poolFactory({ connectionString: url, max: 4, idleTimeoutMillis: 30_000 });
    return pool;
  };
  async function migrate() {
    await client().query(`
      CREATE TABLE IF NOT EXISTS app_schema_migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now());
      CREATE TABLE IF NOT EXISTS review_marks (mark_key TEXT PRIMARY KEY, payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
      CREATE TABLE IF NOT EXISTS review_reasons (id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id), payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
      CREATE TABLE IF NOT EXISTS app_documents (document_key TEXT PRIMARY KEY, payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
      INSERT INTO app_schema_migrations (id) VALUES ('001_initial_json_mirror') ON CONFLICT DO NOTHING;
    `);
  }
  async function upsertReviewMarks(marks, executor = client()) {
    assertPlainObject(marks, "Marks");
    for (const [key, value] of Object.entries(marks)) {
      if (!String(key).trim() || !value || typeof value !== "object" || Array.isArray(value)) continue;
      await executor.query(
        `INSERT INTO review_marks (mark_key, payload, updated_at) VALUES ($1, $2::jsonb, now())
         ON CONFLICT (mark_key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at`,
        [String(key), JSON.stringify(value)],
      );
    }
  }
  async function replaceReviewMarks(marks) {
    assertPlainObject(marks, "Marks");
    const source = client();
    const db = typeof source.connect === "function" ? await source.connect() : source;
    try {
      await db.query("BEGIN");
      await db.query("DELETE FROM review_marks");
      await upsertReviewMarks(marks, db);
      await db.query("COMMIT");
    } catch (error) {
      await db.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      db.release?.();
    }
  }
  async function saveDocument(documentKey, payload) {
    if (!String(documentKey || "").trim()) throw new Error("Document kaliti bo'sh");
    assertPlainObject(payload, "Document");
    await client().query(
      `INSERT INTO app_documents (document_key, payload, updated_at) VALUES ($1, $2::jsonb, now())
       ON CONFLICT (document_key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at`,
      [String(documentKey), JSON.stringify(payload)],
    );
  }
  async function mirrorSummary() {
    const db = client();
    const [marks, documents] = await Promise.all([
      db.query("SELECT count(*)::int AS count FROM review_marks"),
      db.query("SELECT document_key FROM app_documents ORDER BY document_key"),
    ]);
    return { marks: Number(marks.rows?.[0]?.count || 0), documents: (documents.rows || []).map((row) => row.document_key) };
  }
  async function health() {
    if (!enabled()) return { configured: false, healthy: false };
    await client().query("SELECT 1");
    return { configured: true, healthy: true };
  }
  async function close() { if (pool) await pool.end(); pool = null; }
  return { enabled, migrate, upsertReviewMarks, replaceReviewMarks, saveDocument, mirrorSummary, health, close };
}

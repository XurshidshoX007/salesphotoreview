import pg from "pg";

const { Pool } = pg;

export function createPostgresService({ connectionString = process.env.DATABASE_URL } = {}) {
  const url = String(connectionString || "").trim();
  let pool = null;
  const enabled = () => Boolean(url);
  const client = () => {
    if (!enabled()) throw new Error("DATABASE_URL sozlanmagan");
    if (!pool) pool = new Pool({ connectionString: url, max: 4, idleTimeoutMillis: 30_000 });
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
  async function health() {
    if (!enabled()) return { configured: false, healthy: false };
    await client().query("SELECT 1");
    return { configured: true, healthy: true };
  }
  async function close() { if (pool) await pool.end(); pool = null; }
  return { enabled, migrate, health, close };
}

import { createPostgresService } from "../backend/src/services/postgres.service.mjs";

const database = createPostgresService();
if (!database.enabled()) throw new Error("DATABASE_URL sozlanmagan");
try {
  await database.migrate();
  if (!(await database.health()).healthy) throw new Error("PostgreSQL health xatosi");
  console.log("PostgreSQL schema: OK");
} finally {
  await database.close();
}

import "dotenv/config";

import { defineConfig } from "prisma/config";

const fallbackDatabaseUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/iplpredictiongame";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: fallbackDatabaseUrl,
  },
});

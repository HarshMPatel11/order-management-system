import { defineConfig } from "drizzle-kit";

// Note: Using SQLite for schema definition, but actual DB is MongoDB
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: ":memory:",
  },
});

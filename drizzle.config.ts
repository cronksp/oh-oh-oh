import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql", // Default to postgres, can be overridden or handled via multiple configs if strictly needed, but usually postgres is fine for dev.
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

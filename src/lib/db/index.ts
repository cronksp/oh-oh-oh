import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// For now, we default to Postgres. 
// TODO: Add MSSQL support via conditional check on process.env.DB_TYPE

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres";

// if (!connectionString) {
//     throw new Error("DATABASE_URL is not defined");
// }

const client = postgres(connectionString);
export const db = drizzle(client, { schema });

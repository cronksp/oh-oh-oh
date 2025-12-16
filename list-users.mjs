import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "./src/lib/db/schema.ts";

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client);

const allUsers = await db.select({
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  emailVerified: users.emailVerified,
  createdAt: users.createdAt,
}).from(users);

console.log("\n=== Users in Database ===\n");
allUsers.forEach((user, index) => {
  console.log(`${index + 1}. ${user.name} (${user.email})`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Email Verified: ${user.emailVerified}`);
  console.log(`   Created: ${user.createdAt}`);
  console.log("");
});

console.log(`Total users: ${allUsers.length}\n`);

await client.end();

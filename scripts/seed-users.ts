
import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
    if (process.env.NODE_ENV === "production") {
        console.error("❌ Refusing to seed fake users in production environment.");
        process.exit(1);
    }

    console.log("Seeding fake users...");

    const fakeUsers = [
        { name: "Alice Johnson", email: "alice@example.com" },
        { name: "Bob Smith", email: "bob@example.com" },
        { name: "Charlie Brown", email: "charlie@example.com" },
        { name: "Diana Prince", email: "diana@example.com" },
        { name: "Evan Wright", email: "evan@example.com" },
        { name: "Fiona Gallagher", email: "fiona@example.com" },
        { name: "George Martin", email: "george@example.com" },
        { name: "Hannah Lee", email: "hannah@example.com" },
        { name: "Ian Somerhalder", email: "ian@example.com" },
        { name: "Julia Roberts", email: "julia@example.com" },
    ];

    const passwordHash = await hashPassword("password123");

    for (const user of fakeUsers) {
        try {
            await db.insert(users).values({
                name: user.name,
                email: user.email,
                passwordHash,
                role: "user",
                emailVerified: true,
            }).onConflictDoNothing();
            console.log(`Created user: ${user.name}`);
        } catch (error) {
            console.error(`Failed to create user ${user.name}:`, error);
        }
    }

    console.log("Seeding complete.");
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

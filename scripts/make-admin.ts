import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error("Please provide an email address: npm run make-admin <email>");
        process.exit(1);
    }

    console.log(`Looking for user with email: ${email}...`);

    const user = await db.query.users.findFirst({
        where: eq(users.email, email)
    });

    if (!user) {
        console.error(`User not found: ${email}`);
        process.exit(1);
    }

    console.log(`Found user: ${user.name} (${user.id}). Promoting to admin...`);

    await db.update(users)
        .set({ role: "admin" })
        .where(eq(users.id, user.id));

    console.log("Successfully promoted user to admin.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Error promoting user:", err);
    process.exit(1);
});

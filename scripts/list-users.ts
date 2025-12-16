import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

async function main() {
    console.log("Fetching users...");
    const allUsers = await db.select().from(users);
    console.log("Users found:");
    allUsers.forEach(u => {
        console.log(`- ${u.name} (${u.email}) [${u.role}]`);
    });
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});


import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";

async function listUsers() {
    console.log("Fetching users...");
    try {
        const allUsers = await db.select().from(users);
        console.log("Found " + allUsers.length + " users:");
        console.log(JSON.stringify(allUsers, null, 2));
    } catch (error) {
        console.error("Error fetching users:", error);
    }
    process.exit(0);
}

listUsers().catch(console.error);

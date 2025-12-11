"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";

export async function getUsersPublic() {
    const session = await getSession();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    return await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
    }).from(users);
}

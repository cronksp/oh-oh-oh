"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

export async function getUsers() {
    const session = await getSession();
    if (!session?.user) return [];

    // Return all users for now (autocomplete list)
    // In a real app we might want pagination or search, but for MVP fetching all (id, name, email) is fine.
    return await db.select({
        id: users.id,
        name: users.name,
        email: users.email
    }).from(users);
}

export async function getMe() {
    const session = await getSession();
    if (!session?.user) return null;
    const [user] = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role
    }).from(users).where(eq(users.id, session.user.id));
    return user;
}

"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getUsers() {
    const session = await getSession();
    if (session?.user?.role !== "admin") {
        throw new Error("Unauthorized");
    }

    return await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
    }).from(users);
}

export async function deleteUser(userId: string) {
    const session = await getSession();
    if (session?.user?.role !== "admin") {
        throw new Error("Unauthorized");
    }

    await db.delete(users).where(eq(users.id, userId));
    revalidatePath("/admin");
}

export async function resetUserPassword(userId: string, newPassword: string) {
    const session = await getSession();
    if (session?.user?.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const hashedPassword = await hashPassword(newPassword);
    await db.update(users)
        .set({ passwordHash: hashedPassword, updatedAt: new Date() })
        .where(eq(users.id, userId));

    revalidatePath("/admin");
}

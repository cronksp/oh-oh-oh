"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { eq } from "drizzle-orm";
import { z } from "zod";

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function changePassword(data: z.infer<typeof changePasswordSchema>) {
    const session = await getSession();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const validation = changePasswordSchema.safeParse(data);
    if (!validation.success) {
        throw new Error("Invalid input");
    }

    const { currentPassword, newPassword } = validation.data;

    // Fetch user to verify current password
    const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
    if (!user) {
        throw new Error("User not found");
    }

    const isCorrect = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCorrect) {
        throw new Error("Incorrect current password");
    }

    // Hash new password and update
    const newHash = await hashPassword(newPassword);
    await db.update(users)
        .set({ passwordHash: newHash, updatedAt: new Date() })
        .where(eq(users.id, session.user.id));

    return { success: true };
}

export async function searchUsers(query: string) {
    const session = await getSession();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    if (!query || query.length < 2) return [];

    // Simple case-insensitive search
    // Note: In a real app with many users, use full-text search or proper indexing
    const allUsers = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
    }).from(users);

    const lowerQuery = query.toLowerCase();
    return allUsers.filter(u =>
        u.name.toLowerCase().includes(lowerQuery) ||
        u.email.toLowerCase().includes(lowerQuery)
    ).slice(0, 10); // Limit results
}

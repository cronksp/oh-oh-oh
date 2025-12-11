"use server";

import { db } from "@/lib/db";
import { users, emailVerificationCodes, systemSettings } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { eq, and, gt, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logActivity, logActivityForUser } from "@/features/logging/actions";

// --- Profile Management ---

export async function updateProfile(data: { name: string; email: string }) {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const { name, email } = data;

    // Check if email is taken by another user
    if (email !== session.user.email) {
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });
        if (existingUser) {
            throw new Error("Email already in use");
        }
    }

    await db.update(users)
        .set({
            name,
            email,
            emailVerified: email !== session.user.email ? false : undefined, // Reset verification if email changes
            emailVerifiedAt: email !== session.user.email ? null : undefined,
            updatedAt: new Date()
        })
        .where(eq(users.id, session.user.id));

    await logActivity("update_profile", "user", session.user.id, { name, email });
    revalidatePath("/settings");
    revalidatePath("/admin");
}

// --- Email Verification ---

export async function sendVerificationCode() {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.insert(emailVerificationCodes).values({
        userId: session.user.id,
        code,
        expiresAt,
    });

    // In production, send email here. For dev, log to console.
    console.log(`[DEV] Verification code for ${session.user.email}: ${code}`);
    try {
        const fs = await import("fs/promises");
        await fs.writeFile("verification-code.txt", code);
    } catch (e) { console.error("Failed to write dev code file", e); }

    await logActivity("send_verification_code", "user", session.user.id);
    return { success: true, message: "Verification code sent" };
}

export async function verifyEmail(code: string) {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const [record] = await db.select().from(emailVerificationCodes)
        .where(and(
            eq(emailVerificationCodes.userId, session.user.id),
            eq(emailVerificationCodes.code, code),
            gt(emailVerificationCodes.expiresAt, new Date())
        ))
        .orderBy(desc(emailVerificationCodes.createdAt)) // Get latest if multiple? Actually code should be unique enough or we filter by valid
        .limit(1);

    if (!record) {
        throw new Error("Invalid or expired code");
    }

    await db.update(users)
        .set({ emailVerified: true, emailVerifiedAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, session.user.id));

    // Mark code as used? Schema doesn't have 'used' column but we can delete or ignore.
    // Let's delete used codes to keep table clean or just leave them.
    // The plan said 'used' boolean but I missed adding it to schema. 
    // It's fine, we check expiration. We can delete it to prevent reuse.
    await db.delete(emailVerificationCodes).where(eq(emailVerificationCodes.id, record.id));

    await logActivity("verify_email", "user", session.user.id);
    revalidatePath("/settings");
    return { success: true };
}

// --- Work Domain Configuration ---

export async function getWorkEmailDomains(): Promise<string[]> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, "work_email_domains"));
    if (!setting) return [];
    try {
        return JSON.parse(setting.value) as string[];
    } catch {
        return [];
    }
}

export async function updateWorkEmailDomains(domains: string[]) {
    const session = await getSession();
    if (session?.user?.role !== "admin") throw new Error("Unauthorized");

    const value = JSON.stringify(domains);

    await db.insert(systemSettings).values({
        key: "work_email_domains",
        value,
        updatedBy: session.user.id,
    }).onConflictDoUpdate({
        target: systemSettings.key,
        set: { value, updatedAt: new Date(), updatedBy: session.user.id }
    });

    await logActivity("update_work_domains", "system", undefined, { domains });
    revalidatePath("/admin");
}

// --- Password Reset (Self-Service) ---

export async function requestPasswordReset(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
        // Silently fail to prevent enumeration? Or tell user?
        // For internal app, telling is usually fine.
        return { success: true, message: "If account exists, code sent." };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.insert(emailVerificationCodes).values({
        userId: user.id,
        code,
        expiresAt,
    });

    console.log(`[DEV] Password reset code for ${email}: ${code}`);
    try {
        const fs = await import("fs/promises");
        await fs.writeFile("verification-code.txt", code);
    } catch (e) { console.error("Failed to write dev code file", e); }

    // Log without session
    await logActivityForUser(user.id, "request_password_reset", "user", user.id);

    return { success: true, message: "Code sent" };
}

export async function resetPasswordWithCode(email: string, code: string, newPassword: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) throw new Error("User not found");

    const [record] = await db.select().from(emailVerificationCodes)
        .where(and(
            eq(emailVerificationCodes.userId, user.id),
            eq(emailVerificationCodes.code, code),
            gt(emailVerificationCodes.expiresAt, new Date())
        ));

    if (!record) throw new Error("Invalid or expired code");

    const hashedPassword = await hashPassword(newPassword);

    await db.update(users)
        .set({ passwordHash: hashedPassword, updatedAt: new Date() })
        .where(eq(users.id, user.id));

    await db.delete(emailVerificationCodes).where(eq(emailVerificationCodes.id, record.id));

    await logActivityForUser(user.id, "reset_password_self", "user", user.id);

    return { success: true };
}

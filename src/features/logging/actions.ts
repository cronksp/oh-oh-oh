"use server";

import { db } from "@/lib/db";
import { activityLog, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { desc, eq, and, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function logActivity(
    action: string,
    entityType: string,
    entityId?: string,
    details?: any
) {
    try {
        const session = await getSession();
        // We log even if no session (e.g. login failures, system actions), but usually we have a user.
        // If no user, we might need a system user or nullable userId. 
        // Schema says userId is not null. So for now we only log authenticated actions or we need to handle unauth.
        // For password reset request (unauth), we might not have a userId yet if they just provide email.
        // But actually, we can look up the user by email if needed.
        // For now, let's assume we have a session or we pass a userId explicitly if needed?
        // The signature above doesn't take userId. Let's rely on session for now.

        if (!session?.user?.id) {
            console.warn("Attempted to log activity without session user", { action, entityType });
            return;
        }

        await db.insert(activityLog).values({
            userId: session.user.id,
            action,
            entityType,
            entityId,
            details: details ? JSON.stringify(details) : undefined,
            // ipAddress: headers().get("x-forwarded-for"), // Next.js headers() needs to be awaited in newer versions or imported
        });
    } catch (error) {
        console.error("Failed to log activity", error);
        // Don't throw, we don't want to break the main action if logging fails
    }
}

// Overload for when we want to log on behalf of a specific user (e.g. system action affecting a user)
// or when session might not be available but we know the user (e.g. login success)
export async function logActivityForUser(
    userId: string,
    action: string,
    entityType: string,
    entityId?: string,
    details?: any
) {
    try {
        await db.insert(activityLog).values({
            userId,
            action,
            entityType,
            entityId,
            details: details ? JSON.stringify(details) : undefined,
        });
    } catch (error) {
        console.error("Failed to log activity", error);
    }
}

export async function getActivityLog(filters?: {
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}) {
    const session = await getSession();
    if (session?.user?.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const conditions = [];
    if (filters?.userId) conditions.push(eq(activityLog.userId, filters.userId));
    if (filters?.action) conditions.push(eq(activityLog.action, filters.action));
    if (filters?.startDate) conditions.push(gte(activityLog.createdAt, filters.startDate));
    if (filters?.endDate) conditions.push(lte(activityLog.createdAt, filters.endDate));

    const logs = await db.select({
        id: activityLog.id,
        action: activityLog.action,
        entityType: activityLog.entityType,
        entityId: activityLog.entityId,
        details: activityLog.details,
        createdAt: activityLog.createdAt,
        userName: users.name,
        userEmail: users.email,
    })
        .from(activityLog)
        .leftJoin(users, eq(activityLog.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(activityLog.createdAt))
        .limit(filters?.limit || 50);

    return logs;
}

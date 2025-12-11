"use server";

import { db } from "@/lib/db";
import { events, users, eventGroupings, groupings, groupAdmins, eventPermissions } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { decryptUserKey, encryptData, decryptData } from "@/lib/crypto";
import { eq, and, gte, lte, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface CreateEventData {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    isPrivate: boolean;
    isOutOfOffice: boolean;
    eventType: "vacation" | "sick_leave" | "project_travel" | "personal_travel" | "personal_appointment" | "work_meeting" | "work_gathering";
    groupingIds?: string[];
}

export async function createEvent(data: CreateEventData) {
    const session = await getSession();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const { title, description, startTime, endTime, isPrivate, isOutOfOffice, eventType, groupingIds } = data;

    let finalTitle = title;
    let finalDescription = description;
    let encryptedData = null;

    if (isPrivate) {
        // Fetch user to get encrypted private key
        const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
        if (!user || !user.encryptedPrivateKey) {
            throw new Error("User key not found");
        }

        // Decrypt user key
        const userKey = decryptUserKey(user.encryptedPrivateKey);

        // Encrypt event data
        const payload = JSON.stringify({ title, description });
        encryptedData = encryptData(payload, userKey);

        // Mask public fields
        finalTitle = "Private Event";
        finalDescription = "";
    }

    const [newEvent] = await db.insert(events).values({
        userId: session.user.id,
        title: finalTitle,
        description: finalDescription,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isPrivate,
        isOutOfOffice,
        eventType,
        encryptedData,
    }).returning();

    if (groupingIds && groupingIds.length > 0) {
        await db.insert(eventGroupings).values(
            groupingIds.map((gid: string) => ({
                eventId: newEvent.id,
                groupingId: gid,
            }))
        );
    }

    revalidatePath("/calendar");
    return { success: true, event: newEvent };
}

export async function getEvents(start: Date, end: Date, options?: { myStuffOnly?: boolean; groupingIds?: string[]; filterUserId?: string }) {
    const session = await getSession();
    const userId = session?.user?.id;

    // Build base query
    const conditions = [
        gte(events.startTime, start),
        lte(events.endTime, end)
    ];

    // Filter by user if "My Stuff Only" is enabled
    if (options?.myStuffOnly && userId) {
        conditions.push(eq(events.userId, userId));
    }

    // Filter by specific user if provided
    if (options?.filterUserId) {
        conditions.push(eq(events.userId, options.filterUserId));
    }

    const fetchedEvents = await db.select({
        ...getTableColumns(events),
        ownerName: users.name,
    }).from(events)
        .leftJoin(users, eq(events.userId, users.id))
        .where(and(...conditions));

    // Filter by groupings if specified
    let filteredEvents = fetchedEvents;
    if (options?.groupingIds && options.groupingIds.length > 0) {
        const eventGroupingRecords = await db.select()
            .from(eventGroupings)
            .where(
                and(
                    ...options.groupingIds.map(gid => eq(eventGroupings.groupingId, gid))
                )
            );

        const eventIdsWithGrouping = new Set(eventGroupingRecords.map(eg => eg.eventId));
        filteredEvents = fetchedEvents.filter(e => eventIdsWithGrouping.has(e.id));
    }

    // Decrypt private events for the owner
    const processedEvents = await Promise.all(filteredEvents.map(async (event) => {
        let processedEvent = { ...event, groupingIds: [] as string[] }; // Initialize groupingIds

        // Fetch groupings for this event
        const groupingsForEvent = await db.select().from(eventGroupings).where(eq(eventGroupings.eventId, event.id));
        processedEvent.groupingIds = groupingsForEvent.map(g => g.groupingId);

        if (event.isPrivate && event.userId === userId && event.encryptedData) {
            try {
                // We need the user key. Optimization: Fetch it once per request if possible, or cache it.
                // For now, fetch it individually (not optimal but safe).
                // TODO: Optimize this by fetching user key once at the start if needed.

                const [user] = await db.select().from(users).where(eq(users.id, userId));
                if (user && user.encryptedPrivateKey) {
                    const userKey = decryptUserKey(user.encryptedPrivateKey);
                    const decryptedJson = decryptData(event.encryptedData, userKey);
                    const { title, description } = JSON.parse(decryptedJson) as { title: string; description: string };
                    return { ...processedEvent, title, description };
                }
            } catch (e) {
                console.error("Failed to decrypt event", event.id, e);
            }
        }
        return processedEvent;
    }));

    return processedEvents;
}

export async function getEventsWithPermissions(start: Date, end: Date, options?: { myStuffOnly?: boolean; groupingIds?: string[]; filterUserId?: string }) {
    const session = await getSession();
    const userId = session?.user?.id;

    const fetchedEvents = await getEvents(start, end, options);

    if (!userId) {
        return fetchedEvents.map(event => ({
            ...event,
            permissions: { canEdit: false, canDelete: false, isOwner: false }
        }));
    }

    // Batch compute permissions for all events
    const eventsWithPermissions = await Promise.all(
        fetchedEvents.map(async (event) => {
            const [canEdit, canDelete] = await Promise.all([
                canUserEditEvent(event.id, userId),
                canUserDeleteEvent(event.id, userId),
            ]);

            return {
                ...event,
                permissions: {
                    canEdit,
                    canDelete,
                    isOwner: event.userId === userId
                }
            };
        })
    );

    return eventsWithPermissions;
}

// Grouping Actions

export async function getGroupings() {
    return await db.select().from(groupings);
}

export async function createGrouping(data: { name: string; color: string }) {
    const [newGrouping] = await db.insert(groupings).values({
        name: data.name,
        color: data.color,
    }).returning();
    revalidatePath("/calendar");
    return newGrouping;
}

export async function deleteGrouping(id: string) {
    await db.delete(groupings).where(eq(groupings.id, id));
    revalidatePath("/calendar");
}

// Event Update/Delete Actions

export async function updateEvent(eventId: string, data: Partial<CreateEventData>) {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    // Get event to check permissions
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) throw new Error("Event not found");

    //Check permission
    const canEdit = await canUserEditEvent(eventId, session.user.id);
    if (!canEdit) throw new Error("No permission to edit this event");

    // Handle encryption for private events
    let updateData: any = { ...data, updatedAt: new Date() };

    if (event.isPrivate && data.title) {
        const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
        if (user?.encryptedPrivateKey) {
            const userKey = decryptUserKey(user.encryptedPrivateKey);
            const payload = JSON.stringify({ title: data.title, description: data.description });
            updateData.encryptedData = encryptData(payload, userKey);
            updateData.title = "Private Event";
            updateData.description = "";
        }
    }

    if (data.isOutOfOffice !== undefined) {
        updateData.isOutOfOffice = data.isOutOfOffice;
    }

    await db.update(events).set(updateData).where(eq(events.id, eventId));

    // Sync groupings if provided
    if (data.groupingIds) {
        // Delete existing
        await db.delete(eventGroupings).where(eq(eventGroupings.eventId, eventId));

        // Insert new
        if (data.groupingIds.length > 0) {
            await db.insert(eventGroupings).values(
                data.groupingIds.map(gid => ({
                    eventId: eventId,
                    groupingId: gid,
                }))
            );
        }
    }

    revalidatePath("/calendar");
}

export async function deleteEvent(eventId: string) {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const canDelete = await canUserDeleteEvent(eventId, session.user.id);
    if (!canDelete) throw new Error("No permission to delete this event");

    await db.delete(events).where(eq(events.id, eventId));
    revalidatePath("/calendar");
}

// Permission Check Functions

export async function canUserEditEvent(eventId: string, userId: string): Promise<boolean> {
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) return false;

    // Private events: only creator
    if (event.isPrivate) {
        return event.userId === userId;
    }

    // Public events: check hierarchy
    // 1. Creator
    if (event.userId === userId) return true;

    // 2. System admin
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user?.role === "admin") return true;

    // 3. Group admin for any associated group
    const eventGroups = await db.select().from(eventGroupings).where(eq(eventGroupings.eventId, eventId));
    if (eventGroups.length > 0) {
        const groupIds = eventGroups.map(eg => eg.groupingId);
        const groupAdmin = await db.select().from(groupAdmins)
            .where(and(
                eq(groupAdmins.userId, userId),
                ...groupIds.map(gid => eq(groupAdmins.groupingId, gid))
            ));
        if (groupAdmin.length > 0) return true;
    }

    // 4. Explicit permission
    const [permission] = await db.select().from(eventPermissions)
        .where(and(
            eq(eventPermissions.eventId, eventId),
            eq(eventPermissions.userId, userId),
            eq(eventPermissions.canEdit, true)
        ));

    return !!permission;
}

export async function canUserDeleteEvent(eventId: string, userId: string): Promise<boolean> {
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) return false;

    // Private events: only creator
    if (event.isPrivate) {
        return event.userId === userId;
    }

    // Public events: same logic as edit
    if (event.userId === userId) return true;

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user?.role === "admin") return true;

    const eventGroups = await db.select().from(eventGroupings).where(eq(eventGroupings.eventId, eventId));
    if (eventGroups.length > 0) {
        const groupIds = eventGroups.map(eg => eg.groupingId);
        const groupAdmin = await db.select().from(groupAdmins)
            .where(and(
                eq(groupAdmins.userId, userId),
                ...groupIds.map(gid => eq(groupAdmins.groupingId, gid))
            ));
        if (groupAdmin.length > 0) return true;
    }

    const [permission] = await db.select().from(eventPermissions)
        .where(and(
            eq(eventPermissions.eventId, eventId),
            eq(eventPermissions.userId, userId),
            eq(eventPermissions.canDelete, true)
        ));

    return !!permission;
}

// Event Permission Management

export async function grantEventPermission(eventId: string, targetUserId: string, permissions: { canEdit?: boolean; canDelete?: boolean }) {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    // Only event creator can grant permissions
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event || event.userId !== session.user.id) {
        throw new Error("Only event creator can grant permissions");
    }

    if (event.isPrivate) {
        throw new Error("Cannot grant permissions on private events");
    }

    await db.insert(eventPermissions).values({
        eventId,
        userId: targetUserId,
        canEdit: permissions.canEdit ?? false,
        canDelete: permissions.canDelete ?? false,
        grantedBy: session.user.id,
    }).onConflictDoUpdate({
        target: [eventPermissions.eventId, eventPermissions.userId],
        set: {
            canEdit: permissions.canEdit ?? false,
            canDelete: permissions.canDelete ?? false,
        }
    });

    revalidatePath("/calendar");
}

export async function revokeEventPermission(eventId: string, targetUserId: string) {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event || event.userId !== session.user.id) {
        throw new Error("Only event creator can revoke permissions");
    }

    await db.delete(eventPermissions).where(and(
        eq(eventPermissions.eventId, eventId),
        eq(eventPermissions.userId, targetUserId)
    ));

    revalidatePath("/calendar");
}

export async function getEventPermissions(eventId: string) {
    return await db.select().from(eventPermissions).where(eq(eventPermissions.eventId, eventId));
}

// Group Admin Management

export async function assignGroupAdmin(groupingId: string, targetUserId: string) {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    // Only system admin can assign group admins
    const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
    if (user?.role !== "admin") {
        throw new Error("Only system admins can assign group admins");
    }

    await db.insert(groupAdmins).values({
        groupingId,
        userId: targetUserId,
        assignedBy: session.user.id,
    }).onConflictDoNothing();

    revalidatePath("/admin");
}

export async function removeGroupAdmin(groupingId: string, targetUserId: string) {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
    if (user?.role !== "admin") {
        throw new Error("Only system admins can remove group admins");
    }

    await db.delete(groupAdmins).where(and(
        eq(groupAdmins.groupingId, groupingId),
        eq(groupAdmins.userId, targetUserId)
    ));

    revalidatePath("/admin");
}

export async function getGroupAdmins(groupingId: string) {
    return await db.select().from(groupAdmins).where(eq(groupAdmins.groupingId, groupingId));
}

export async function getUserManagedGroups(userId: string) {
    return await db.select().from(groupAdmins).where(eq(groupAdmins.userId, userId));
}

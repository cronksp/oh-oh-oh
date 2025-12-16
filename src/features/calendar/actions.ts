"use server";

import { db } from "@/lib/db";
import { events, users, eventGroupings, groupings, groupAdmins, eventPermissions, eventTypes, eventAttendees, teams, teamMembers, eventTeams, activityLog } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { decryptUserKey, encryptData, decryptData } from "@/lib/crypto";
import { eq, and, gte, lte, getTableColumns, isNull, or, inArray, desc, like, SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface CreateEventData {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    isPrivate: boolean;
    isOutOfOffice: boolean;
    eventTypeId: string;
    // eventType: "vacation" | "sick_leave" | "project_travel" | "personal_travel" | "personal_appointment" | "work_meeting" | "work_gathering";
    groupingIds?: string[];
    attendeeIds?: string[]; // Direct user invites
    teamIds?: string[]; // Team invites (recursive)
}

export async function createEvent(data: CreateEventData) {
    const session = await getSession();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const { title, description, startTime, endTime, isPrivate, isOutOfOffice, eventTypeId, groupingIds } = data;

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

    // Fetch event type to get the key for backward compatibility
    const [et] = await db.select().from(eventTypes).where(eq(eventTypes.id, data.eventTypeId));
    if (!et) throw new Error("Invalid event type");

    // Verify if the key is a valid enum value, otherwise fallback to "personal_appointment"
    // This allows custom/private types to exist without breaking the strict Postgres Enum constraint
    const validEnumValues = [
        "vacation", "sick_leave", "project_travel", "personal_travel",
        "personal_appointment", "work_meeting", "work_gathering"
    ];
    const legacyEventType = validEnumValues.includes(et.key) ? et.key : "personal_appointment";

    const [newEvent] = await db.insert(events).values({
        userId: session.user.id,
        title: finalTitle,
        description: finalDescription,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isPrivate,
        isOutOfOffice,
        eventType: legacyEventType as any,
        eventTypeId: data.eventTypeId,
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

    // Handle Attendees (Only if NOT private, per plan)
    if (!isPrivate) {
        const { attendeeIds, teamIds } = data;
        const attendeesToInsert = new Map<string, { userId: string, invitedViaTeamId: string | null }>();

        // 1. Direct Attendees
        if (attendeeIds) {
            attendeeIds.forEach(uid => {
                if (uid !== session.user.id) { // Don't add owner as attendee yet? Or maybe owner is auto-accepted? Usually owner is implicit.
                    attendeesToInsert.set(uid, { userId: uid, invitedViaTeamId: null });
                }
            });
        }

        // 2. Team Attendees (Recursive)
        if (teamIds && teamIds.length > 0) {
            // Helper to fetch all subteams recursively
            // For MVP, lets just fetch all teams and build a tree in memory to find descendants, 
            // since we don't have a closure table or recursive CTE query ready in simple drizzle yet.
            // Actually, we can just do a recursive function.

            const allTeams = await db.select().from(teams);
            const allTeamMembers = await db.select().from(teamMembers);

            const getSubTeamIds = (rootIds: string[]): string[] => {
                let foundIds = new Set<string>(rootIds);
                let toSearch = [...rootIds];

                while (toSearch.length > 0) {
                    const currentId = toSearch.pop();
                    const children = allTeams.filter(t => t.parentTeamId === currentId).map(t => t.id);
                    children.forEach(childId => {
                        if (!foundIds.has(childId)) {
                            foundIds.add(childId);
                            toSearch.push(childId);
                        }
                    });
                }
                return Array.from(foundIds);
            };

            const expandedTeamIds = getSubTeamIds(teamIds);

            // Now find members of all these teams
            // We want to track WHICH team invited them. 
            // Deduplication rule: "A user in multiple teams gets only ONE invite."
            // "prioritizing the most specific sub-team if multiple?" -> Hard to define "specific" without depth. 
            // Let's just pick the first one we find for now.

            for (const tid of expandedTeamIds) {
                const members = allTeamMembers.filter(tm => tm.teamId === tid);
                for (const member of members) {
                    if (member.userId !== session.user.id && !attendeesToInsert.has(member.userId)) {
                        attendeesToInsert.set(member.userId, { userId: member.userId, invitedViaTeamId: tid });
                    }
                }
            }
        }

        if (attendeesToInsert.size > 0) {
            await db.insert(eventAttendees).values(
                Array.from(attendeesToInsert.values()).map(a => ({
                    eventId: newEvent.id,
                    userId: a.userId,
                    invitedViaTeamId: a.invitedViaTeamId,
                    status: 'pending' as const // Explicitly cast to literal type
                }))
            );
        }

        // 3. Store Explicit Team Invites
        if (teamIds && teamIds.length > 0) {
            await db.insert(eventTeams).values(
                teamIds.map(tid => ({
                    eventId: newEvent.id,
                    teamId: tid
                }))
            );
        }
    }

    revalidatePath("/calendar");
    return { success: true, event: newEvent };
}

export async function getEvents(start: Date, end: Date, options?: { myStuffOnly?: boolean; groupingIds?: string[]; filterUserId?: string; searchTerm?: string }) {
    const session = await getSession();
    const userId = session?.user?.id;

    // Build base query
    const conditions: SQL[] = [
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

    // Search term
    if (options?.searchTerm) {
        // ILIKE for case-insensitive search
        conditions.push(
            or(
                like(events.title, `%${options.searchTerm}%`),
                like(events.description, `%${options.searchTerm}%`)
            )
        );
    }

    const fetchedEvents = await db.select({
        ...getTableColumns(events),
        ownerName: users.name,
        eventTypeName: eventTypes.name, // Fetch the real name
    }).from(events)
        .leftJoin(users, eq(events.userId, users.id))
        .leftJoin(eventTypes, eq(events.eventTypeId, eventTypes.id))
        .where(and(...conditions)!);

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
        let processedEvent: any = { ...event, groupingIds: [] as string[], attendees: [] }; // Initialize groupingIds

        // Fetch groupings for this event
        const groupingsForEvent = await db.select().from(eventGroupings).where(eq(eventGroupings.eventId, event.id));
        processedEvent.groupingIds = groupingsForEvent.map(g => g.groupingId);

        // Fetch Invited Teams (for Edit form)
        const invitedTeams = await db.select().from(eventTeams).where(eq(eventTeams.eventId, event.id));
        processedEvent.teamIds = invitedTeams.map(t => t.teamId);

        // Fetch Attendees (If user is owner or attendee)
        // Public/Shared events: Attendees list visible to owner and attendees.
        // Private events: Attendees logic disabled for now per plan, but code should be safe.
        // We know userId (current user).

        // Determine permissions
        // We need to know if current user is an attendee.
        // We already fetched attendees into processedEvent.attendees if public/shared.
        // If private, attendees list is empty/hidden, so isAttendee is false (unless we want to support hidden attendees later).

        // Determine permissions
        let isAttendee = false;
        if (userId) {
            if (processedEvent.attendees) {
                isAttendee = processedEvent.attendees.some((a: any) => a.userId === userId);
            } else if (!event.isPrivate) {
                const membership = await db.select().from(eventAttendees).where(and(
                    eq(eventAttendees.eventId, event.id),
                    eq(eventAttendees.userId, userId)
                ));
                isAttendee = membership.length > 0;
            }
        }

        const isOwner = event.userId === userId;

        if (isOwner || isAttendee) {
            // processedEvent.attendees is already set for public/shared if we fetched it above
        }

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
                    processedEvent.title = title;
                    processedEvent.description = description;
                }
            } catch (e) {
                console.error("Failed to decrypt event", event.id, e);
            }
        }
        return processedEvent;
    }));

    return processedEvents;
}

export async function rsvpEvent(eventId: string, status: "accepted" | "declined" | "tentative") {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    await db.update(eventAttendees)
        .set({ status, updatedAt: new Date() })
        .where(and(
            eq(eventAttendees.eventId, eventId),
            eq(eventAttendees.userId, session.user.id)
        ));

    revalidatePath("/calendar");
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
    const session = await getSession();
    const userId = session?.user?.id;

    // Return Public groupings (userId is null) AND Private groupings owned by user
    if (userId) {
        return await db.select().from(groupings).where(
            or(
                isNull(groupings.userId),
                eq(groupings.userId, userId)
            )
        );
    }

    return await db.select().from(groupings).where(isNull(groupings.userId));
}

export async function createGrouping(data: { name: string; color: string; isPrivate?: boolean }) {
    const session = await getSession();
    const userId = session?.user?.id;

    // If private, require user. If public, technically anyone can add public grouping for now? 
    // Or maybe we restrict public grouping creation to admins? User didn't specify.
    // For now, allow both.

    const [newGrouping] = await db.insert(groupings).values({
        name: data.name,
        color: data.color,
        userId: data.isPrivate && userId ? userId : null,
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

    if (data.eventTypeId) {
        const [et] = await db.select().from(eventTypes).where(eq(eventTypes.id, data.eventTypeId));
        if (!et) throw new Error("Invalid event type");

        // Verify if the key is a valid enum value, otherwise fallback to "personal_appointment"
        const validEnumValues = [
            "vacation", "sick_leave", "project_travel", "personal_travel",
            "personal_appointment", "work_meeting", "work_gathering"
        ];
        const legacyEventType = validEnumValues.includes(et.key) ? et.key : "personal_appointment";

        updateData.eventTypeId = data.eventTypeId;
        updateData.eventType = legacyEventType;
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

    // Handle Attendees Sync (Only if NOT private)
    if (!event.isPrivate && (data.attendeeIds || data.teamIds)) {
        const attendeeIds = data.attendeeIds || [];
        const teamIds = data.teamIds || [];

        const targetAttendees = new Map<string, { userId: string, invitedViaTeamId: string | null }>();

        // 1. Direct
        attendeeIds.forEach(uid => {
            if (uid !== session.user.id) {
                targetAttendees.set(uid, { userId: uid, invitedViaTeamId: null });
            }
        });

        // 2. Recursive Teams
        if (teamIds.length > 0) {
            const allTeams = await db.select().from(teams);
            const allTeamMembers = await db.select().from(teamMembers);

            const getSubTeamIds = (rootIds: string[]): string[] => {
                let foundIds = new Set<string>(rootIds);
                let toSearch = [...rootIds];
                while (toSearch.length > 0) {
                    const currentId = toSearch.pop();
                    const children = allTeams.filter(t => t.parentTeamId === currentId).map(t => t.id);
                    children.forEach(childId => {
                        if (!foundIds.has(childId)) {
                            foundIds.add(childId);
                            toSearch.push(childId);
                        }
                    });
                }
                return Array.from(foundIds);
            };

            const expandedTeamIds = getSubTeamIds(teamIds);
            for (const tid of expandedTeamIds) {
                const members = allTeamMembers.filter(tm => tm.teamId === tid);
                for (const member of members) {
                    if (member.userId !== session.user.id && !targetAttendees.has(member.userId)) {
                        targetAttendees.set(member.userId, { userId: member.userId, invitedViaTeamId: tid });
                    }
                }
            }
        }

        // Fetch existing
        const existingAttendees = await db.select().from(eventAttendees).where(eq(eventAttendees.eventId, eventId));
        const existingUserIds = new Set(existingAttendees.map(a => a.userId));

        // Delete removed
        const toDeleteIds = existingAttendees
            .filter(a => !targetAttendees.has(a.userId))
            .map(a => a.userId);

        if (toDeleteIds.length > 0) {
            await db.delete(eventAttendees).where(and(
                eq(eventAttendees.eventId, eventId),
                inArray(eventAttendees.userId, toDeleteIds)
            ));
        }

        // Add new
        const toAdd = Array.from(targetAttendees.values()).filter(a => !existingUserIds.has(a.userId));
        if (toAdd.length > 0) {
            await db.insert(eventAttendees).values(
                toAdd.map(a => ({
                    eventId: eventId,
                    userId: a.userId,
                    invitedViaTeamId: a.invitedViaTeamId,
                    status: 'pending' as const
                }))
            );
        }

        // Sync Explicit Teams
        if (data.teamIds) { // Only sync if provided (even empty array)
            // Delete existing
            await db.delete(eventTeams).where(eq(eventTeams.eventId, eventId));

            // Insert new
            if (data.teamIds.length > 0) {
                await db.insert(eventTeams).values(
                    data.teamIds.map(tid => ({
                        eventId: eventId,
                        teamId: tid
                    }))
                );
            }
        }
    }

    revalidatePath("/calendar");
}

export async function deleteEvent(eventId: string) {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    // Fetch event first to get its details for logging and permission checks
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) throw new Error("Event not found");

    const canDelete = await canUserDeleteEvent(eventId, session.user.id);
    if (!canDelete) throw new Error("No permission to delete this event");

    await db.delete(events).where(eq(events.id, eventId));

    // Log Activity
    await db.insert(activityLog).values({
        userId: session.user.id,
        action: "delete_event",
        entityType: "event",
        entityId: eventId,
        details: JSON.stringify({ title: event.title }),
    });

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

// Event Types Management
export async function getEventTypes() {
    // 1. Fetch system types
    const systemTypes = await db.select().from(eventTypes).where(isNull(eventTypes.userId));

    // Auto-seed if empty
    if (systemTypes.length === 0) {
        const defaults = [
            { name: "Work Meeting", key: "work_meeting", color: "#3b82f6" },
            { name: "Vacation", key: "vacation", color: "#22c55e" },
            { name: "Sick Leave", key: "sick_leave", color: "#ef4444" },
            { name: "Project Travel", key: "project_travel", color: "#a855f7" },
            { name: "Personal Travel", key: "personal_travel", color: "#ec4899" },
            { name: "Personal Appointment", key: "personal_appointment", color: "#eab308" },
            { name: "Work Gathering", key: "work_gathering", color: "#f97316" },
        ];

        await db.insert(eventTypes).values(defaults).onConflictDoNothing();
        // Re-fetch
        return await db.select().from(eventTypes).where(isNull(eventTypes.userId));
    }

    const session = await getSession();
    const userId = session?.user?.id;

    if (userId) {
        const myTypes = await db.select().from(eventTypes).where(eq(eventTypes.userId, userId));
        return [...systemTypes, ...myTypes];
    }

    return systemTypes;
}

export async function createEventType(data: { name: string; color: string; isPrivate: boolean }) {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    // System type (isPrivate=false) requires Admin
    if (!data.isPrivate) {
        const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
        if (user?.role !== "admin") throw new Error("Only admins can create system event types");

        await db.insert(eventTypes).values({
            name: data.name,
            key: data.name.toLowerCase().replace(/\s+/g, '_'),
            color: data.color,
            userId: null
        });
    } else {
        // Private type
        await db.insert(eventTypes).values({
            name: data.name,
            key: data.name.toLowerCase().replace(/\s+/g, '_') + '_' + session.user.id.slice(0, 8),
            color: data.color,
            userId: session.user.id
        });
    }

    revalidatePath("/calendar");
}

// Activity Log
export async function getActivityLog(filter: "all" | "public" = "all") {
    const session = await getSession();
    if (!session?.user) return [];

    let query = db.select({
        id: activityLog.id,
        action: activityLog.action,
        entityType: activityLog.entityType,
        details: activityLog.details,
        createdAt: activityLog.createdAt,
        userName: users.name,
        userEmail: users.email,
        title: events.title
    })
        .from(activityLog)
        .leftJoin(users, eq(activityLog.userId, users.id))
        .leftJoin(events, and(eq(activityLog.entityType, "event"), eq(activityLog.entityId, events.id)))
        .orderBy(desc(activityLog.createdAt))
        .limit(50);

    if (filter === "public") {
        query.where(eq(events.isPrivate, false));
    }

    return await query;
}

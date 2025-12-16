"use server";

import { db } from "@/lib/db";
import { teams, teamMembers, users, activityLog } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, and, like, or, isNull, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createTeam(data: { name: string; parentTeamId?: string | null; isPrivate?: boolean }) {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    // Permission Check:
    // 1. Root Public Team -> System Admin only
    // 2. Sub-Team -> Team Admin of parent (TODO: recursive check? For now, simplistic check if user is admin of parent)
    // 3. Private Team -> Anyone

    if (!data.isPrivate && !data.parentTeamId) {
        // Creating a ROOT Public Team -> Requires System Admin
        const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
        if (user?.role !== "admin") {
            throw new Error("Only System Admins can create root public teams");
        }
    } else if (!data.isPrivate && data.parentTeamId) {
        // Creating a Sub-Team -> Requires to be Admin of Parent Team OR System Admin
        // For simplicity in MVP: System Admins + Parent Team Admins
        const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
        const isSystemAdmin = user?.role === "admin";

        if (!isSystemAdmin) {
            const [membership] = await db.select().from(teamMembers).where(and(
                eq(teamMembers.teamId, data.parentTeamId),
                eq(teamMembers.userId, session.user.id),
                eq(teamMembers.isAdmin, true)
            ));
            if (!membership) throw new Error("You must be an admin of the parent team to create a sub-team");
        }
    }

    const [newTeam] = await db.insert(teams).values({
        name: data.name,
        parentTeamId: data.parentTeamId || null,
        isPrivate: data.isPrivate || false,
        createdBy: session.user.id,
    }).returning();

    // Add creator as Admin of the new team
    await db.insert(teamMembers).values({
        teamId: newTeam.id,
        userId: session.user.id,
        isAdmin: true,
    });

    // Log Activity
    await db.insert(activityLog).values({
        userId: session.user.id,
        action: "create_team",
        entityType: "team",
        entityId: newTeam.id,
        details: JSON.stringify({ name: newTeam.name, isPrivate: newTeam.isPrivate }),
    });

    revalidatePath("/teams");
    return newTeam;
}

export async function getTeams() {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return { publicTeams: [], myPrivateTeams: [] };

    // Fetch Public Teams AND My Private Teams
    // Using simple logic: isPrivate = false OR (isPrivate = true AND createdBy = me | member = me)
    // Actually, let's keep it simple: 
    // Public Teams: Visible to everyone.
    // Private Teams: Visible if I am a member or creator.

    // Fetch all public teams
    const publicTeams = await db.select().from(teams).where(eq(teams.isPrivate, false));

    // Fetch private teams I am part of
    const myPrivateTeams = await db.select({
        team: teams
    })
        .from(teams)
        .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
        .where(and(
            eq(teams.isPrivate, true),
            eq(teamMembers.userId, userId)
        ));

    // De-dupe if necessary (unlikely given logic, but safe to map)
    const publicTeamList = publicTeams;
    const privateTeamList = myPrivateTeams.map(t => t.team);

    // Return combined or structured?
    // Let's return flat list for now, the UI will tree-ify it.
    // Wait, separating them might be easier for the UI sidebar.
    return {
        publicTeams,
        myPrivateTeams: privateTeamList
    };
}

export async function addTeamMembers(teamId: string, userIds: string[], isAdmin: boolean = false) {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    // Check permissions: Must be team admin or system admin
    const canManage = await canManageTeam(teamId, session.user.id);
    if (!canManage) throw new Error("Insufficient permissions");

    // Filter valid users
    const targetUsers = await db.select().from(users).where(inArray(users.id, userIds));
    const validUserIds = targetUsers.map(u => u.id);

    if (validUserIds.length === 0) return;

    await db.insert(teamMembers).values(
        validUserIds.map(uid => ({
            teamId,
            userId: uid,
            isAdmin,
        }))
    ).onConflictDoNothing();

    // Log Activity for each? Or one batch log? 
    // Let's log one batch entry or multiple. For simpler activity log, maybe one entry per user or "Added X members".
    // Existing activity log logic was in separate calls potentially?
    // Actually, let's insert activity logs for each added member for granularity.
    await db.insert(activityLog).values(
        validUserIds.map(uid => ({
            userId: session.user.id,
            action: "add_team_member" as const,
            entityType: "team" as const,
            entityId: teamId,
            details: JSON.stringify({ memberId: uid, isAdmin }),
        }))
    );

    revalidatePath("/teams");
}

export async function removeTeamMember(teamId: string, userId: string) {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const canManage = await canManageTeam(teamId, session.user.id);
    if (!canManage) throw new Error("Insufficient permissions");

    await db.delete(teamMembers).where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId)
    ));

    revalidatePath("/teams");
}

export async function getTeamMembers(teamId: string) {
    return await db.select({
        userId: users.id,
        name: users.name,
        email: users.email,
        isAdmin: teamMembers.isAdmin,
        joinedAt: teamMembers.joinedAt,
    })
        .from(teamMembers)
        .innerJoin(users, eq(teamMembers.userId, users.id))
        .where(eq(teamMembers.teamId, teamId));
}

// Helper: Check if user can manage a team
async function canManageTeam(teamId: string, userId: string) {
    // 1. System Admin
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user?.role === "admin") return true;

    // 2. Team Admin
    const [membership] = await db.select().from(teamMembers).where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId),
        eq(teamMembers.isAdmin, true)
    ));
    return !!membership;
}

export async function updateMemberRole(teamId: string, userId: string, isAdmin: boolean) {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const canManage = await canManageTeam(teamId, session.user.id);
    if (!canManage) throw new Error("Insufficient permissions");

    await db.update(teamMembers)
        .set({ isAdmin })
        .where(and(
            eq(teamMembers.teamId, teamId),
            eq(teamMembers.userId, userId)
        ));

    revalidatePath("/teams");
}

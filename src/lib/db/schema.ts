import { pgTable, uuid, text, timestamp, boolean, pgEnum, foreignKey } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const eventTypeEnum = pgEnum("event_type", [
    "vacation",
    "sick_leave",
    "project_travel",
    "personal_travel",
    "personal_appointment",
    "work_meeting",
    "work_gathering",
]);

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: roleEnum("role").default("user").notNull(),
    encryptedPrivateKey: text("encrypted_private_key"), // Encrypted with System Master Key
    emailVerified: boolean("email_verified").default(false).notNull(),
    emailVerifiedAt: timestamp("email_verified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailVerificationCodes = pgTable("email_verification_codes", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    code: text("code").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    verifiedAt: timestamp("verified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const systemSettings = pgTable("system_settings", {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull().unique(),
    value: text("value").notNull(), // JSON string
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    updatedBy: uuid("updated_by").references(() => users.id),
});

export const activityLog = pgTable("activity_log", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    details: text("details"), // JSON string
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupings = pgTable("groupings", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color"), // Hex code
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }), // Nullable. Null = Public.
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eventTypes = pgTable("event_types", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    key: text("key").notNull().unique(), // e.g. "work_meeting" (for code refs)
    color: text("color"),
    userId: uuid("user_id").references(() => users.id), // Nullable for System types. Null = Public System Type.
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    title: text("title").notNull(), // Encrypted if private
    description: text("description"), // Encrypted if private
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    isPrivate: boolean("is_private").default(false).notNull(),
    isOutOfOffice: boolean("is_out_of_office").default(false).notNull(),
    eventType: eventTypeEnum("event_type").notNull(),
    eventTypeId: uuid("event_type_id").references(() => eventTypes.id), // Nullable during migration, should be notNull eventually
    metadata: text("metadata"), // JSON string, encrypted if private
    encryptedData: text("encrypted_data"), // Stores title/desc/metadata if private
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eventGroupings = pgTable("event_groupings", {
    eventId: uuid("event_id").references(() => events.id).notNull(),
    groupingId: uuid("grouping_id").references(() => groupings.id).notNull(),
}, (t) => ({
    pk: { columns: [t.eventId, t.groupingId] },
}));

export const groupAdmins = pgTable("group_admins", {
    groupingId: uuid("grouping_id").references(() => groupings.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    assignedBy: uuid("assigned_by").references(() => users.id).notNull(),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
}, (t) => ({
    pk: { columns: [t.groupingId, t.userId] },
}));

export const eventPermissions = pgTable("event_permissions", {
    eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    canEdit: boolean("can_edit").default(false).notNull(),
    canDelete: boolean("can_delete").default(false).notNull(),
    grantedBy: uuid("granted_by").references(() => users.id).notNull(),
    grantedAt: timestamp("granted_at").defaultNow().notNull(),
}, (t) => ({
    pk: { columns: [t.eventId, t.userId] },
}));

export const attendeeStatusEnum = pgEnum("attendee_status", ["pending", "accepted", "declined", "tentative"]);

export const teams = pgTable("teams", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    parentTeamId: uuid("parent_team_id"),
    createdBy: uuid("created_by").references(() => users.id).notNull(),
    isPrivate: boolean("is_private").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
    parentTeamFk: foreignKey({
        columns: [t.parentTeamId],
        foreignColumns: [t.id],
        name: "teams_parent_team_id_fk"
    }),
}));

export const teamMembers = pgTable("team_members", {
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    isAdmin: boolean("is_admin").default(false).notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (t) => ({
    pk: { columns: [t.teamId, t.userId] },
}));

export const eventAttendees = pgTable("event_attendees", {
    eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    status: attendeeStatusEnum("status").default("pending").notNull(),
    invitedViaTeamId: uuid("invited_via_team_id").references(() => teams.id, { onDelete: "set null" }),
    invitedAt: timestamp("invited_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
    pk: { columns: [t.eventId, t.userId] },
}));

export type EventType = typeof eventTypes.$inferSelect;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Grouping = typeof groupings.$inferSelect;
export type Event = typeof events.$inferSelect;
export type GroupAdmin = typeof groupAdmins.$inferSelect;
export type EventPermission = typeof eventPermissions.$inferSelect;
export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type ActivityLog = typeof activityLog.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type EventAttendee = typeof eventAttendees.$inferSelect;


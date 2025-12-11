import { pgTable, uuid, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Grouping = typeof groupings.$inferSelect;
export type Event = typeof events.$inferSelect;
export type GroupAdmin = typeof groupAdmins.$inferSelect;
export type EventPermission = typeof eventPermissions.$inferSelect;
export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type ActivityLog = typeof activityLog.$inferSelect;

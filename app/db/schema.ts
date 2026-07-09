import { relations } from "drizzle-orm";
import {
	boolean,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["OWNER", "ADMIN"]);
export const ticketStatusEnum = pgEnum("ticket_status", [
	"DENIED",
	"APPROVED",
	"PENDING",
]);
export const ticketStageEnum = pgEnum("ticket_stage", [
	"TODO",
	"IN_PROGRESS",
	"DONE",
]);

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull(),
	image: text("image"),
	role: userRoleEnum("role").notNull().default("OWNER"),
	banned: boolean("banned").notNull().default(false),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	impersonatedBy: text("impersonated_by"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at"),
	updatedAt: timestamp("updated_at"),
});

export const location = pgTable("location", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	address: text("address").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userLocation = pgTable(
	"user_location",
	{
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		locationId: uuid("location_id")
			.notNull()
			.references(() => location.id, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.userId, table.locationId] })],
);

export const ticket = pgTable("ticket", {
	id: uuid("id").primaryKey().defaultRandom(),
	reporterName: text("reporter_name").notNull(),
	description: text("description").notNull(),
	ownerId: text("owner_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	locationId: uuid("location_id")
		.notNull()
		.references(() => location.id, { onDelete: "cascade" }),
	roomNumber: text("room_number").notNull(),
	status: ticketStatusEnum("status").notNull().default("PENDING"),
	stage: ticketStageEnum("stage"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ticketImage = pgTable("ticket_image", {
	id: uuid("id").primaryKey().defaultRandom(),
	ticketId: uuid("ticket_id")
		.notNull()
		.references(() => ticket.id, { onDelete: "cascade" }),
	storageKey: text("storage_key").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userRelations = relations(user, ({ many }) => ({
	locations: many(userLocation),
	ownedTickets: many(ticket),
}));

export const locationRelations = relations(location, ({ many }) => ({
	users: many(userLocation),
	tickets: many(ticket),
}));

export const userLocationRelations = relations(userLocation, ({ one }) => ({
	user: one(user, {
		fields: [userLocation.userId],
		references: [user.id],
	}),
	location: one(location, {
		fields: [userLocation.locationId],
		references: [location.id],
	}),
}));

export const ticketRelations = relations(ticket, ({ one, many }) => ({
	owner: one(user, {
		fields: [ticket.ownerId],
		references: [user.id],
	}),
	location: one(location, {
		fields: [ticket.locationId],
		references: [location.id],
	}),
	images: many(ticketImage),
}));

export const ticketImageRelations = relations(ticketImage, ({ one }) => ({
	ticket: one(ticket, {
		fields: [ticketImage.ticketId],
		references: [ticket.id],
	}),
}));

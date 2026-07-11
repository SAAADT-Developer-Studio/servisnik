import { and, desc, eq, sql } from "drizzle-orm";

import type { Db } from "../db/db.server";
import { location, ticket, ticketImage, user, userLocation } from "../db/schema";
import { parsePhotoFiles, uploadTicketImages } from "../storage/images.server";
import { isTicketStage, type TicketStage } from "./tickets";

export type { TicketStage } from "./tickets";
export { isTicketStage } from "./tickets";

type CreateReportInput = {
	locationId: string;
	reporterName: string;
	roomNumber: string;
	description: string;
	photos: File[];
};

export type CreateReportResult =
	| { ok: true; ticketId: string }
	| { ok: false; error: string };

export function parseReportForm(formData: FormData) {
	const reporterName = formData.get("reporterName")?.toString().trim() ?? "";
	const roomNumber = formData.get("roomNumber")?.toString().trim() ?? "";
	const description = formData.get("description")?.toString().trim() ?? "";
	const photos = parsePhotoFiles(formData);
	const fieldErrors: Record<string, string> = {};

	if (!reporterName) {
		fieldErrors.reporterName = "Enter your name.";
	}

	if (!roomNumber) {
		fieldErrors.roomNumber = "Enter the room number.";
	}

	if (!description) {
		fieldErrors.description = "Describe what is wrong.";
	}

	return { reporterName, roomNumber, description, photos, fieldErrors };
}

export async function getLocationForReport(db: Db, locationId: string) {
	return db.query.location.findFirst({
		where: eq(location.id, locationId),
	});
}

async function findLocationOwnerId(db: Db, locationId: string) {
	const owner = await db
		.select({ id: user.id })
		.from(userLocation)
		.innerJoin(user, eq(userLocation.userId, user.id))
		.where(and(eq(userLocation.locationId, locationId), eq(user.role, "OWNER")))
		.limit(1);

	if (owner[0]) {
		return owner[0].id;
	}

	const fallback = await db
		.select({ id: user.id })
		.from(userLocation)
		.innerJoin(user, eq(userLocation.userId, user.id))
		.where(eq(userLocation.locationId, locationId))
		.limit(1);

	return fallback[0]?.id ?? null;
}

export async function createReport(
	db: Db,
	assets: R2Bucket,
	input: CreateReportInput,
) {
	const ownerId = await findLocationOwnerId(db, input.locationId);

	if (!ownerId) {
		return { ok: false as const, error: "This location is not set up to receive reports." };
	}

	const [created] = await db
		.insert(ticket)
		.values({
			reporterName: input.reporterName,
			roomNumber: input.roomNumber,
			description: input.description,
			locationId: input.locationId,
			ownerId,
			status: "PENDING",
		})
		.returning({ id: ticket.id });

	const uploaded = await uploadTicketImages(
		assets,
		created.id,
		input.photos,
	);

	if (uploaded.length > 0) {
		await db.insert(ticketImage).values(
			uploaded.map((storageKey) => ({
				ticketId: created.id,
				storageKey,
			})),
		);
	}

	return { ok: true as const, ticketId: created.id };
}

export async function getOwnerBoardTickets(db: Db, ownerId: string) {
	const approved = await db.query.ticket.findMany({
		where: and(eq(ticket.ownerId, ownerId), eq(ticket.status, "APPROVED")),
		with: { location: true },
		orderBy: [desc(ticket.updatedAt)],
	});

	return { approved };
}

export async function getOwnerPendingTickets(db: Db, ownerId: string) {
	return db.query.ticket.findMany({
		where: and(eq(ticket.ownerId, ownerId), eq(ticket.status, "PENDING")),
		with: { location: true, images: true },
		orderBy: [desc(ticket.createdAt)],
	});
}

export async function getOwnerPendingTicketCount(db: Db, ownerId: string) {
	const [result] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(ticket)
		.where(and(eq(ticket.ownerId, ownerId), eq(ticket.status, "PENDING")));

	return result?.count ?? 0;
}

export async function getTicketImageForOwner(db: Db, imageId: string) {
	return db.query.ticketImage.findFirst({
		where: eq(ticketImage.id, imageId),
		with: {
			ticket: {
				columns: { ownerId: true },
			},
		},
	});
}

export async function approveTicket(db: Db, ticketId: string, ownerId: string) {
	const [updated] = await db
		.update(ticket)
		.set({
			status: "APPROVED",
			stage: "TODO",
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(ticket.id, ticketId),
				eq(ticket.ownerId, ownerId),
				eq(ticket.status, "PENDING"),
			),
		)
		.returning({ id: ticket.id });

	return updated ?? null;
}

export async function denyTicket(db: Db, ticketId: string, ownerId: string) {
	const [updated] = await db
		.update(ticket)
		.set({
			status: "DENIED",
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(ticket.id, ticketId),
				eq(ticket.ownerId, ownerId),
				eq(ticket.status, "PENDING"),
			),
		)
		.returning({ id: ticket.id });

	return updated ?? null;
}

export async function updateTicketStage(
	db: Db,
	ticketId: string,
	ownerId: string,
	stage: TicketStage,
) {
	const [updated] = await db
		.update(ticket)
		.set({ stage, updatedAt: new Date() })
		.where(
			and(
				eq(ticket.id, ticketId),
				eq(ticket.ownerId, ownerId),
				eq(ticket.status, "APPROVED"),
			),
		)
		.returning({ id: ticket.id });

	return updated ?? null;
}

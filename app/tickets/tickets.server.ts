import { and, eq } from "drizzle-orm";

import { createDb } from "../db/db.server";
import { location, ticket, ticketImage, user, userLocation } from "../db/schema";
import { parsePhotoFiles, uploadTicketImages } from "../storage/images.server";

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

export async function getLocationForReport(
	databaseUrl: string,
	locationId: string,
) {
	const db = createDb(databaseUrl);

	return db.query.location.findFirst({
		where: eq(location.id, locationId),
	});
}

async function findLocationOwnerId(db: ReturnType<typeof createDb>, locationId: string) {
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
	env: Cloudflare.Env,
	input: CreateReportInput,
) {
	const db = createDb(env.DATABASE_URL);
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
		env.ASSETS,
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

import type { Route } from "./+types/api.ticket-images.$imageId";
import { requireOwner } from "@/auth/auth-helpers.server";
import { createDb } from "@/db/db.server";
import { getTicketImageForOwner } from "@/tickets/tickets.server";

export async function loader({ context, request, params }: Route.LoaderArgs) {
	const { user } = await requireOwner(context.cloudflare.env, request);
	const imageId = params.imageId;

	if (!imageId) {
		throw new Response("Not found", { status: 404 });
	}

	const db = createDb(context.cloudflare.env.DATABASE_URL);
	const image = await getTicketImageForOwner(db, imageId);

	if (!image || image.ticket.ownerId !== user.id) {
		throw new Response("Not found", { status: 404 });
	}

	const object = await context.cloudflare.env.ASSETS.get(
		image.storageKey,
	);

	if (!object) {
		throw new Response("Not found", { status: 404 });
	}

	const headers = new Headers();
	const contentType = object.httpMetadata?.contentType ?? "image/jpeg";
	headers.set("Content-Type", contentType);
	headers.set("Cache-Control", "private, max-age=3600");

	return new Response(object.body, { headers });
}

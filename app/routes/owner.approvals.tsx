import { useMemo, useState } from "react";
import { Link, useFetcher } from "react-router";
import { Check, ClipboardList, Loader2, Trash2 } from "lucide-react";

import type { Route } from "./+types/owner.approvals";
import { requireOwner } from "@/auth/auth-helpers.server";
import { LocationFilter } from "@/components/location-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLocationColor } from "@/lib/location-colors";
import {
	approveTicket,
	denyTicket,
	getOwnerPendingTickets,
} from "@/tickets/tickets.server";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Odobritve – Servisnik" }];
}

function formatDate(date: Date) {
	return new Intl.DateTimeFormat("sl-SI", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

type PendingTicket = Awaited<ReturnType<typeof getOwnerPendingTickets>>[number];

export async function loader({ context, request }: Route.LoaderArgs) {
	const { user, db, impersonatedBy } = await requireOwner(context, request);
	const pending = await getOwnerPendingTickets(db, user.id);

	const locationEntries = await db.query.userLocation.findMany({
		where: (userLocations, { eq: eqFn }) => eqFn(userLocations.userId, user.id),
		with: { location: true },
	});

	const locations = locationEntries
		.map((entry) => entry.location)
		.sort((a, b) => a.name.localeCompare(b.name));

	let impersonatorName: string | null = null;
	if (impersonatedBy) {
		const impersonator = await db.query.user.findFirst({
			where: (users, { eq: eqFn }) => eqFn(users.id, impersonatedBy),
		});
		impersonatorName = impersonator?.name ?? null;
	}

	return {
		user,
		locations,
		pending,
		isImpersonating: Boolean(impersonatedBy),
		impersonatorName,
	};
}

export async function action({ context, request }: Route.ActionArgs) {
	const { user, db } = await requireOwner(context, request);
	const formData = await request.formData();
	const intent = formData.get("intent");
	const ticketId = String(formData.get("ticketId") ?? "");

	if (!ticketId) {
		return { error: "Manjkajoči podatki." };
	}

	if (intent === "approve-ticket") {
		const updated = await approveTicket(db, ticketId, user.id);
		return updated
			? { success: true }
			: { error: "Zahteve ni bilo mogoče odobriti." };
	}

	if (intent === "discard-ticket") {
		const updated = await denyTicket(db, ticketId, user.id);
		return updated
			? { success: true }
			: { error: "Zahteve ni bilo mogoče zavreči." };
	}

	return { error: "Neznano dejanje." };
}

function PendingTicketCard({
	ticket,
	locationIds,
}: {
	ticket: PendingTicket;
	locationIds: string[];
}) {
	const fetcher = useFetcher<typeof action>();
	const isSubmitting =
		fetcher.state !== "idle" && fetcher.formData?.get("ticketId") === ticket.id;

	return (
		<article className="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm">
			{ticket.images.length > 0 ? (
				<div className="flex gap-1 overflow-x-auto bg-muted/30 p-2">
					{ticket.images.map((image) => (
						<img
							key={image.id}
							src={`/api/ticket-images/${image.id}`}
							alt="Priložena fotografija"
							className="h-32 w-32 shrink-0 rounded-lg object-cover"
						/>
					))}
				</div>
			) : null}

			<div className="flex flex-1 flex-col p-4">
				<p className="font-semibold leading-snug">{ticket.description}</p>
				<div className="mt-3 flex items-start justify-between gap-3">
					<div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
						<span
							className={`size-2.5 shrink-0 rounded-full ${getLocationColor(ticket.location.id, locationIds)}`}
						/>
						<span className="truncate">{ticket.location.address}</span>
					</div>
					<span className="shrink-0 text-sm text-muted-foreground">
						Soba {ticket.roomNumber}
					</span>
				</div>
				<p className="mt-2 text-sm text-muted-foreground">
					{ticket.reporterName}
				</p>
				<p className="mt-1 text-xs text-muted-foreground/70">
					{formatDate(ticket.createdAt)}
				</p>

				<div className="mt-4 flex gap-2">
					<fetcher.Form method="post" className="flex-1">
						<input type="hidden" name="intent" value="approve-ticket" />
						<input type="hidden" name="ticketId" value={ticket.id} />
						<Button
							type="submit"
							size="sm"
							className="w-full"
							disabled={isSubmitting}
						>
							{isSubmitting &&
							fetcher.formData?.get("intent") === "approve-ticket" ? (
								<Loader2 className="animate-spin" />
							) : (
								<Check />
							)}
							Odobri
						</Button>
					</fetcher.Form>
					<fetcher.Form method="post" className="flex-1">
						<input type="hidden" name="intent" value="discard-ticket" />
						<input type="hidden" name="ticketId" value={ticket.id} />
						<Button
							type="submit"
							variant="outline"
							size="sm"
							className="w-full"
							disabled={isSubmitting}
						>
							{isSubmitting &&
							fetcher.formData?.get("intent") === "discard-ticket" ? (
								<Loader2 className="animate-spin" />
							) : (
								<Trash2 />
							)}
							Zavrzi
						</Button>
					</fetcher.Form>
				</div>
			</div>
		</article>
	);
}

export default function OwnerApprovalsPage({
	loaderData,
}: Route.ComponentProps) {
	const { locations, pending } = loaderData;
	const [selectedLocationId, setSelectedLocationId] = useState("all");

	const locationIds = useMemo(
		() => locations.map((entry) => entry.id),
		[locations],
	);

	const filteredPending = useMemo(() => {
		if (selectedLocationId === "all") {
			return pending;
		}

		return pending.filter((ticket) => ticket.locationId === selectedLocationId);
	}, [pending, selectedLocationId]);

	return (
		<div className="min-h-screen bg-background">
			<main className="mx-auto max-w-6xl px-4 py-6">
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-3">
						<h1 className="text-xl font-semibold tracking-tight">
							Čakajo na odobritev
						</h1>
						{pending.length > 0 ? (
							<Badge variant="secondary">{pending.length}</Badge>
						) : null}
					</div>

					<LocationFilter
						locations={locations}
						value={selectedLocationId}
						onValueChange={setSelectedLocationId}
						className="w-full sm:max-w-xs"
					/>
				</div>

				{filteredPending.length === 0 ? (
					<div className="flex flex-col items-center gap-3 rounded-2xl bg-white py-16 text-center">
						<ClipboardList className="size-10 text-muted-foreground/40" />
						<p className="text-sm text-muted-foreground">
							{pending.length === 0
								? "Trenutno ni zahtev, ki čakajo na odobritev."
								: "Za izbrano lokacijo ni zahtev."}
						</p>
						<Link
							to="/owner"
							className="text-sm text-muted-foreground underline-offset-4 hover:underline"
						>
							Nazaj na nadzorno ploščo
						</Link>
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{filteredPending.map((ticket) => (
							<PendingTicketCard
								key={ticket.id}
								ticket={ticket}
								locationIds={locationIds}
							/>
						))}
					</div>
				)}
			</main>
		</div>
	);
}

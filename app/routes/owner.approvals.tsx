import { useEffect, useMemo, useState } from "react";
import { Link, useFetcher } from "react-router";
import {
	Check,
	ClipboardList,
	Home,
	Loader2,
	LogOut,
	MapPin,
	Menu,
	Trash2,
	Wrench,
} from "lucide-react";

import type { Route } from "./+types/owner.approvals";
import { requireOwner } from "@/auth/auth-helpers.server";
import { authClient } from "@/auth/auth.client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createDb } from "@/db/db.server";
import {
	approveTicket,
	denyTicket,
	getOwnerPendingTickets,
} from "@/tickets/tickets.server";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Odobritve – Servisnik" }];
}

const LOCATION_COLORS = [
	"bg-emerald-500",
	"bg-red-500",
	"bg-amber-400",
	"bg-blue-500",
	"bg-violet-500",
	"bg-pink-500",
];

function getLocationColor(locationId: string, locationIds: string[]) {
	const index = locationIds.indexOf(locationId);
	return LOCATION_COLORS[index % LOCATION_COLORS.length];
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

type PendingTicket = Awaited<
	ReturnType<typeof getOwnerPendingTickets>
>[number];

export async function loader({ context, request }: Route.LoaderArgs) {
	const { user, impersonatedBy } = await requireOwner(
		context.cloudflare.env,
		request,
	);
	const db = createDb(context.cloudflare.env.DATABASE_URL);
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
	const { user } = await requireOwner(context.cloudflare.env, request);
	const formData = await request.formData();
	const intent = formData.get("intent");
	const ticketId = String(formData.get("ticketId") ?? "");
	const db = createDb(context.cloudflare.env.DATABASE_URL);

	if (!ticketId) {
		return { error: "Manjkajoči podatki." };
	}

	if (intent === "approve-ticket") {
		const updated = await approveTicket(db, ticketId, user.id);
		return updated ? { success: true } : { error: "Zahteve ni bilo mogoče odobriti." };
	}

	if (intent === "discard-ticket") {
		const updated = await denyTicket(db, ticketId, user.id);
		return updated ? { success: true } : { error: "Zahteve ni bilo mogoče zavreči." };
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
		fetcher.state !== "idle" &&
		fetcher.formData?.get("ticketId") === ticket.id;

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
				<p className="mt-2 text-sm text-muted-foreground">{ticket.reporterName}</p>
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

export default function OwnerApprovalsPage({ loaderData }: Route.ComponentProps) {
	const {
		user,
		locations,
		pending,
		isImpersonating,
		impersonatorName,
	} = loaderData;
	const [menuOpen, setMenuOpen] = useState(false);
	const [selectedLocationId, setSelectedLocationId] = useState("all");
	const [isStopping, setIsStopping] = useState(false);

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

	useEffect(() => {
		if (!menuOpen) {
			return;
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setMenuOpen(false);
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [menuOpen]);

	async function stopImpersonating() {
		setIsStopping(true);

		try {
			await authClient.admin.stopImpersonating();
			window.location.href = "/admin";
		} catch {
			setIsStopping(false);
		}
	}

	return (
		<div className="min-h-screen bg-background">
			{isImpersonating ? (
				<Alert className="rounded-none border-x-0 border-t-0">
					<AlertTitle>Impersonation active</AlertTitle>
					<AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<span>
							You are viewing the dashboard as {user.name}
							{impersonatorName ? ` (admin: ${impersonatorName})` : ""}.
						</span>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={isStopping}
							onClick={stopImpersonating}
						>
							{isStopping ? (
								<Loader2 className="animate-spin" />
							) : (
								<LogOut />
							)}
							Exit impersonation
						</Button>
					</AlertDescription>
				</Alert>
			) : null}

			<header className="border-b bg-white">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
					<div className="flex items-center gap-2">
						<div className="relative flex size-8 items-center justify-center">
							<Home className="size-7 text-foreground" strokeWidth={1.75} />
							<Wrench
								className="absolute -right-0.5 -bottom-0.5 size-3.5 text-foreground"
								strokeWidth={2}
							/>
						</div>
						<span className="text-lg font-semibold tracking-tight">servisnik</span>
					</div>

					<div className="relative">
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-expanded={menuOpen}
							aria-label="Meni"
							onClick={() => setMenuOpen((open) => !open)}
						>
							<Menu />
						</Button>

						{menuOpen ? (
							<>
								<button
									type="button"
									className="fixed inset-0 z-40 cursor-default bg-transparent"
									aria-label="Zapri meni"
									onClick={() => setMenuOpen(false)}
								/>
								<nav className="absolute top-full right-0 z-50 mt-2 w-48 rounded-lg border bg-white py-1 shadow-lg">
									<Link
										to="/owner"
										className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
										onClick={() => setMenuOpen(false)}
									>
										<Home className="size-4" />
										Nadzorna plošča
									</Link>
									<Link
										to="/owner/locations"
										className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
										onClick={() => setMenuOpen(false)}
									>
										<MapPin className="size-4" />
										Lokacije
									</Link>
									{!isImpersonating ? (
										<button
											type="button"
											className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted"
											onClick={() => authClient.signOut()}
										>
											<LogOut className="size-4" />
											Odjava
										</button>
									) : null}
								</nav>
							</>
						) : null}
					</div>
				</div>
			</header>

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

					<label className="sr-only" htmlFor="location-filter">
						Filtriraj po lokaciji
					</label>
					<select
						id="location-filter"
						value={selectedLocationId}
						onChange={(event) => setSelectedLocationId(event.target.value)}
						className="rounded-lg bg-button px-4 py-2 text-sm font-medium text-white"
					>
						<option value="all">vse lokacije</option>
						{locations.map((entry) => (
							<option key={entry.id} value={entry.id}>
								{entry.name}
							</option>
						))}
					</select>
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

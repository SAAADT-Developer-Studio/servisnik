import { useEffect, useMemo, useState } from "react";
import { Link, useFetcher } from "react-router";
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	closestCorners,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
	type DragEndEvent,
	type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ClipboardList } from "lucide-react";

import type { Route } from "./+types/owner";
import { requireOwner } from "@/auth/auth-helpers.server";
import { LocationFilter } from "@/components/location-filter";
import { useHydrated } from "@/hooks/use-hydrated";
import { getLocationColor } from "@/lib/location-colors";
import { cn } from "@/lib/utils";
import {
	isTicketStage,
	getTicketStage,
	type TicketStage,
} from "@/tickets/tickets";
import {
	getOwnerBoardTickets,
	getOwnerPendingTicketCount,
	updateTicketStage,
} from "@/tickets/tickets.server";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Servisnik" }];
}

const STAGES = [
	{ key: "TODO" as const, label: "OPRAVILA" },
	{ key: "IN_PROGRESS" as const, label: "V teku" },
	{ key: "DONE" as const, label: "Končano" },
];

type BoardTicket = {
	id: string;
	locationId: string;
	reporterName: string;
	description: string;
	roomNumber: string;
	stage: TicketStage | null;
	location: {
		id: string;
		name: string;
		address: string;
	};
};

function groupTicketsByStage(tickets: BoardTicket[]) {
	const grouped: Record<TicketStage, BoardTicket[]> = {
		TODO: [],
		IN_PROGRESS: [],
		DONE: [],
	};

	for (const ticket of tickets) {
		grouped[getTicketStage(ticket.stage)].push(ticket);
	}

	return grouped;
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const { user, db, impersonatedBy } = await requireOwner(context, request);
	const { approved } = await getOwnerBoardTickets(db, user.id);
	const pendingCount = await getOwnerPendingTicketCount(db, user.id);

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
		pendingCount,
		approved,
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

	if (intent === "update-stage") {
		const stage = String(formData.get("stage") ?? "");
		if (!isTicketStage(stage)) {
			return { error: "Neveljavna faza." };
		}

		const updated = await updateTicketStage(db, ticketId, user.id, stage);
		return updated
			? { success: true }
			: { error: "Faze ni bilo mogoče posodobiti." };
	}

	return { error: "Neznano dejanje." };
}

function TicketCardContent({
	ticket,
	locationIds,
}: {
	ticket: BoardTicket;
	locationIds: string[];
}) {
	return (
		<>
			<p className="font-semibold leading-snug text-card-foreground">
				{ticket.description}
			</p>
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
		</>
	);
}

function DraggableTicketCard({
	ticket,
	locationIds,
}: {
	ticket: BoardTicket;
	locationIds: string[];
}) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: ticket.id,
			data: { stage: getTicketStage(ticket.stage) },
		});

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Translate.toString(transform) }}
			className={cn(
				"rounded-xl border border-border bg-card p-4 shadow-sm",
				"cursor-grab touch-none active:cursor-grabbing",
				isDragging && "opacity-40",
			)}
			{...listeners}
			{...attributes}
		>
			<TicketCardContent ticket={ticket} locationIds={locationIds} />
		</div>
	);
}

function KanbanColumn({
	stage,
	label,
	tickets,
	locationIds,
}: {
	stage: TicketStage;
	label: string;
	tickets: BoardTicket[];
	locationIds: string[];
}) {
	const { setNodeRef, isOver } = useDroppable({ id: stage });

	return (
		<section className="flex min-h-[420px] flex-col rounded-2xl bg-white p-4">
			<h2 className="mb-4 text-sm font-semibold tracking-[0.15em] text-muted-foreground uppercase">
				{label}
			</h2>
			<div
				ref={setNodeRef}
				className={cn(
					"flex flex-1 flex-col gap-3 rounded-xl p-1 transition-colors",
					isOver && "bg-primary/5 ring-2 ring-primary/20 ring-inset",
				)}
			>
				{tickets.length === 0 ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						Ni opravil
					</p>
				) : (
					tickets.map((ticket) => (
						<DraggableTicketCard
							key={ticket.id}
							ticket={ticket}
							locationIds={locationIds}
						/>
					))
				)}
			</div>
		</section>
	);
}

function KanbanBoardStatic({
	tickets,
	locationIds,
}: {
	tickets: BoardTicket[];
	locationIds: string[];
}) {
	const grouped = groupTicketsByStage(tickets);

	return (
		<div className="grid gap-4 lg:grid-cols-3">
			{STAGES.map((column) => (
				<section
					key={column.key}
					className="flex min-h-[420px] flex-col rounded-2xl bg-white p-4"
				>
					<h2 className="mb-4 text-sm font-semibold tracking-[0.15em] text-muted-foreground uppercase">
						{column.label}
					</h2>
					<div className="flex flex-1 flex-col gap-3 rounded-xl p-1">
						{grouped[column.key].length === 0 ? (
							<p className="py-8 text-center text-sm text-muted-foreground">
								Ni opravil
							</p>
						) : (
							grouped[column.key].map((ticket) => (
								<div
									key={ticket.id}
									className="rounded-xl border border-border bg-card p-4 shadow-sm"
								>
									<TicketCardContent
										ticket={ticket}
										locationIds={locationIds}
									/>
								</div>
							))
						)}
					</div>
				</section>
			))}
		</div>
	);
}

function KanbanBoardGate({
	tickets,
	locationIds,
}: {
	tickets: BoardTicket[];
	locationIds: string[];
}) {
	const hydrated = useHydrated();

	if (!hydrated) {
		return (
			<KanbanBoardStatic tickets={tickets} locationIds={locationIds} />
		);
	}

	return <KanbanBoard tickets={tickets} locationIds={locationIds} />;
}

function KanbanBoard({
	tickets,
	locationIds,
}: {
	tickets: BoardTicket[];
	locationIds: string[];
}) {
	const fetcher = useFetcher<typeof action>();
	const [boardTickets, setBoardTickets] = useState(() =>
		groupTicketsByStage(tickets),
	);
	const [activeTicket, setActiveTicket] = useState<BoardTicket | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 },
		}),
	);

	useEffect(() => {
		setBoardTickets(groupTicketsByStage(tickets));
	}, [tickets]);

	useEffect(() => {
		if (fetcher.data?.error) {
			setBoardTickets(groupTicketsByStage(tickets));
		}
	}, [fetcher.data, tickets]);

	function handleDragStart(event: DragStartEvent) {
		const ticketId = String(event.active.id);

		for (const column of STAGES) {
			const found = boardTickets[column.key].find(
				(entry) => entry.id === ticketId,
			);
			if (found) {
				setActiveTicket(found);
				break;
			}
		}
	}

	function handleDragEnd(event: DragEndEvent) {
		setActiveTicket(null);

		const { active, over } = event;
		if (!over) {
			return;
		}

		const ticketId = String(active.id);
		const newStage = String(over.id);
		const currentStage = active.data.current?.stage as TicketStage | undefined;

		if (
			!currentStage ||
			!isTicketStage(newStage) ||
			newStage === currentStage
		) {
			return;
		}

		setBoardTickets((previous) => {
			const ticket = previous[currentStage].find(
				(entry) => entry.id === ticketId,
			);
			if (!ticket) {
				return previous;
			}

			return {
				...previous,
				[currentStage]: previous[currentStage].filter(
					(entry) => entry.id !== ticketId,
				),
				[newStage]: [...previous[newStage], { ...ticket, stage: newStage }],
			};
		});

		void fetcher.submit(
			{
				intent: "update-stage",
				ticketId,
				stage: newStage,
			},
			{ method: "post" },
		);
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCorners}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onDragCancel={() => setActiveTicket(null)}
		>
			<div className="grid gap-4 lg:grid-cols-3">
				{STAGES.map((column) => (
					<KanbanColumn
						key={column.key}
						stage={column.key}
						label={column.label}
						tickets={boardTickets[column.key]}
						locationIds={locationIds}
					/>
				))}
			</div>

			<DragOverlay dropAnimation={null}>
				{activeTicket ? (
					<div className="rotate-1 rounded-xl border border-border bg-card p-4 shadow-lg">
						<TicketCardContent
							ticket={activeTicket}
							locationIds={locationIds}
						/>
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	);
}

export default function OwnerPage({ loaderData }: Route.ComponentProps) {
	const { locations, pendingCount, approved } = loaderData;
	const [selectedLocationId, setSelectedLocationId] = useState("all");

	const locationIds = useMemo(
		() => locations.map((entry) => entry.id),
		[locations],
	);

	const filteredApproved = useMemo(() => {
		if (selectedLocationId === "all") {
			return approved;
		}

		return approved.filter(
			(ticket) => ticket.locationId === selectedLocationId,
		);
	}, [approved, selectedLocationId]);

	return (
		<div className="min-h-screen bg-background">
			<main className="mx-auto max-w-6xl px-4 py-6">
				<div className="mb-6 flex justify-end">
					<LocationFilter
						locations={locations}
						value={selectedLocationId}
						onValueChange={setSelectedLocationId}
						className="w-full sm:max-w-xs"
					/>
				</div>

				{pendingCount > 0 ? (
					<Link
						to="/owner/approvals"
						className="mb-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm transition-colors hover:bg-amber-100"
					>
						<span className="flex items-center gap-2 font-medium text-amber-900">
							<ClipboardList className="size-4" />
							{pendingCount === 1
								? "1 zahteva čaka na odobritev"
								: `${pendingCount} zahtev čaka na odobritev`}
						</span>
						<span className="text-amber-700">Preglej →</span>
					</Link>
				) : null}

				<KanbanBoardGate
					tickets={filteredApproved}
					locationIds={locationIds}
				/>
			</main>
		</div>
	);
}

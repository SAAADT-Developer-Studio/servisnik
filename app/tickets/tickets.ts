export type TicketStage = "TODO" | "IN_PROGRESS" | "DONE";

const validStages = new Set<TicketStage>(["TODO", "IN_PROGRESS", "DONE"]);

export function isTicketStage(value: string): value is TicketStage {
	return validStages.has(value as TicketStage);
}

export function getTicketStage(stage: TicketStage | null): TicketStage {
	return stage ?? "TODO";
}

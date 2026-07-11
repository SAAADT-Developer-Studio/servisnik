export const LOCATION_COLORS = [
	"bg-emerald-500",
	"bg-red-500",
	"bg-amber-400",
	"bg-blue-500",
	"bg-violet-500",
	"bg-pink-500",
] as const;

export function getLocationColor(locationId: string, locationIds: string[]) {
	const index = locationIds.indexOf(locationId);
	return LOCATION_COLORS[index % LOCATION_COLORS.length];
}

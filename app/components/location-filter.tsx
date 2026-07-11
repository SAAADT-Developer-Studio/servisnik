import { useMemo } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, MapPin, Search } from "lucide-react";

import { getLocationColor } from "@/lib/location-colors";
import { cn } from "@/lib/utils";

type Location = {
	id: string;
	name: string;
	address: string;
};

type LocationOption = {
	value: string;
	label: string;
	address?: string;
};

function LocationFilterItem({
	option,
	locationIds,
}: {
	option: LocationOption;
	locationIds: string[];
}) {
	return (
		<Combobox.Item
			value={option}
			className={cn(
				"flex cursor-default items-center gap-3 rounded-lg px-2.5 py-2 text-sm outline-none select-none",
				"data-highlighted:bg-muted data-selected:bg-muted/70",
			)}
		>
			<Combobox.ItemIndicator className="flex size-4 shrink-0 items-center justify-center text-foreground">
				<Check className="size-3.5" />
			</Combobox.ItemIndicator>

			{option.value === "all" ? (
				<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted">
					<MapPin className="size-3 text-muted-foreground" />
				</span>
			) : (
				<span
					className={cn(
						"size-2.5 shrink-0 rounded-full",
						getLocationColor(option.value, locationIds),
					)}
				/>
			)}

			<div className="min-w-0 flex-1">
				<p className="truncate font-medium text-foreground">{option.label}</p>
				{option.address ? (
					<p className="truncate text-xs text-muted-foreground">
						{option.address}
					</p>
				) : null}
			</div>
		</Combobox.Item>
	);
}

export function LocationFilter({
	locations,
	value,
	onValueChange,
	className,
}: {
	locations: Location[];
	value: string;
	onValueChange: (value: string) => void;
	className?: string;
}) {
	const locationIds = useMemo(
		() => locations.map((entry) => entry.id),
		[locations],
	);

	const options = useMemo<LocationOption[]>(
		() => [
			{ value: "all", label: "Vse lokacije" },
			...locations.map((entry) => ({
				value: entry.id,
				label: entry.name,
				address: entry.address,
			})),
		],
		[locations],
	);

	const selectedOption =
		options.find((option) => option.value === value) ?? options[0];

	return (
		<Combobox.Root
			items={options}
			value={selectedOption}
			onValueChange={(option) => {
				if (option) {
					onValueChange(option.value);
				}
			}}
			isItemEqualToValue={(item, selected) => item.value === selected.value}
			autoHighlight
		>
			<Combobox.Label className="sr-only">Filtriraj po lokaciji</Combobox.Label>

			<Combobox.Trigger
				className={cn(
					"group flex w-full items-center gap-2.5 rounded-xl border border-border bg-white px-3 py-2.5 text-left text-sm shadow-sm transition-colors outline-none",
					"hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
					"data-popup-open:bg-muted/40",
					className,
				)}
			>
				<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground">
					<MapPin className="size-3.5" />
				</span>

				<span className="min-w-0 flex-1">
					<span className="block text-[0.65rem] font-medium tracking-[0.12em] text-muted-foreground uppercase">
						Lokacija
					</span>
					<Combobox.Value>
						{(option: LocationOption | null) => (
							<span className="block truncate font-medium text-foreground">
								{option?.label ?? "Vse lokacije"}
							</span>
						)}
					</Combobox.Value>
				</span>

				<Combobox.Icon className="flex size-4 shrink-0 items-center justify-center text-muted-foreground transition-transform group-data-popup-open:rotate-180">
					<ChevronDown className="size-4" />
				</Combobox.Icon>
			</Combobox.Trigger>

			<Combobox.Portal>
				<Combobox.Positioner className="z-50" sideOffset={6}>
					<Combobox.Popup
						className={cn(
							"w-(--anchor-width) min-w-[16rem] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg",
							"data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
							"data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
						)}
						initialFocus
					>
						<div className="border-b border-border p-2">
							<div className="relative">
								<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
								<Combobox.Input
									placeholder="Išči lokacijo..."
									className={cn(
										"h-9 w-full rounded-lg border border-input bg-transparent pr-2.5 pl-8 text-sm outline-none",
										"placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
									)}
								/>
							</div>
						</div>

						<Combobox.Empty>
							<p className="px-3 py-6 text-center text-sm text-muted-foreground">
								Ni zadetkov
							</p>
						</Combobox.Empty>

						<Combobox.List className="max-h-64 overflow-y-auto p-1.5 outline-none">
							{(option: LocationOption) => (
								<LocationFilterItem
									key={option.value}
									option={option}
									locationIds={locationIds}
								/>
							)}
						</Combobox.List>
					</Combobox.Popup>
				</Combobox.Positioner>
			</Combobox.Portal>
		</Combobox.Root>
	);
}

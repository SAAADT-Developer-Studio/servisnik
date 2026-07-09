import { useRef, useState, type ReactNode } from "react";
import { CircleAlert, Camera, ImagePlus, Loader2, X } from "lucide-react";
import { data, Form, isRouteErrorResponse, useNavigation } from "react-router";

import type { Route } from "./+types/location.$locationId.report";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	createReport,
	getLocationForReport,
	parseReportForm,
} from "../tickets/tickets.server";

type ReportActionData =
	| { ok: true; ticketId: string }
	| { ok: false; fieldErrors?: Record<string, string>; error?: string };

type ReportLoaderData = {
	location: {
		id: string;
		name: string;
		address: string;
	};
};

export function meta({ data }: Route.MetaArgs) {
	return [
		{
			title: data?.location
				? `Report issue — ${data.location.name}`
				: "Report issue",
		},
	];
}

export async function loader({ context, params }: Route.LoaderArgs) {
	const locationData = await getLocationForReport(
		context.cloudflare.env.DATABASE_URL,
		params.locationId,
	);

	if (!locationData) {
		throw data({ message: "Location not found." }, { status: 404 });
	}

	return { location: locationData };
}

export async function action({ context, params, request }: Route.ActionArgs): Promise<ReportActionData> {
	const formData = await request.formData();
	const { reporterName, roomNumber, description, photos, fieldErrors } =
		parseReportForm(formData);

	if (Object.keys(fieldErrors).length > 0) {
		return { ok: false as const, fieldErrors };
	}

	const result = await createReport(context.cloudflare.env, {
		locationId: params.locationId,
		reporterName,
		roomNumber,
		description,
		photos,
	});

	if (!result.ok) {
		return { ok: false as const, error: result.error };
	}

	return { ok: true as const, ticketId: result.ticketId };
}

export default function LocationReport({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting";
	const photoInputRef = useRef<HTMLInputElement>(null);
	const [photoPreviews, setPhotoPreviews] = useState<
		{ id: string; url: string; file: File }[]
	>([]);
	const reportAction = actionData as ReportActionData | undefined;
	const reportData = loaderData as ReportLoaderData | undefined;

	if (!reportData) {
		return null;
	}

	if (reportAction?.ok) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--muted)_0%,var(--background)_55%)] px-4 py-16">
				<Card className="w-full max-w-md shadow-sm">
					<CardHeader className="text-center">
						<CardTitle className="text-2xl font-semibold tracking-tight">
							Report submitted
						</CardTitle>
						<CardDescription>
							Your issue at {reportData.location.name} has been sent for review.
							Someone will look into it soon.
						</CardDescription>
					</CardHeader>
				</Card>
			</main>
		);
	}

	function addPhotos(files: FileList | null) {
		if (!files) {
			return;
		}

		const next = [...photoPreviews];

		for (const file of files) {
			if (next.length >= 5) {
				break;
			}

			next.push({
				id: crypto.randomUUID(),
				url: URL.createObjectURL(file),
				file,
			});
		}

		setPhotoPreviews(next);
	}

	function removePhoto(id: string) {
		setPhotoPreviews((current) => {
			const removed = current.find((photo) => photo.id === id);
			if (removed) {
				URL.revokeObjectURL(removed.url);
			}

			return current.filter((photo) => photo.id !== id);
		});
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--muted)_0%,var(--background)_55%)] px-4 py-10">
			<Card className="w-full max-w-md shadow-sm">
				<CardHeader className="gap-2">
					<p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground/60 uppercase">
						Servisnik
					</p>
					<CardTitle className="text-2xl font-semibold tracking-tight">
						Report an issue
					</CardTitle>
					<CardDescription>
						{reportData.location.name} — {reportData.location.address}
					</CardDescription>
				</CardHeader>

				<Form
					method="post"
					encType="multipart/form-data"
					className="contents"
					onSubmit={() => {
						const input = photoInputRef.current;
						if (!input) {
							return;
						}

						const transfer = new DataTransfer();
						for (const photo of photoPreviews) {
							transfer.items.add(photo.file);
						}
						input.files = transfer.files;
					}}
				>
					<CardContent className="space-y-4">
						<Field
							id="reporterName"
							label="Your name"
							error={reportAction?.fieldErrors?.reporterName}
						>
							<input
								id="reporterName"
								name="reporterName"
								type="text"
								autoComplete="name"
								required
								className={inputClassName}
								placeholder="Jane Doe"
							/>
						</Field>

						<Field
							id="roomNumber"
							label="Room"
							error={reportAction?.fieldErrors?.roomNumber}
						>
							<input
								id="roomNumber"
								name="roomNumber"
								type="text"
								required
								className={inputClassName}
								placeholder="e.g. 204"
							/>
						</Field>

						<Field
							id="description"
							label="What is wrong?"
							error={reportAction?.fieldErrors?.description}
						>
							<textarea
								id="description"
								name="description"
								required
								rows={4}
								className={`${inputClassName} min-h-24 resize-y py-2`}
								placeholder="Describe the problem…"
							/>
						</Field>

						<div className="space-y-2">
							<p className="text-sm font-medium">Photos (optional)</p>
							<p className="text-xs text-muted-foreground">
								Add up to 5 photos. On mobile you can take a picture directly.
							</p>

							<input
								ref={photoInputRef}
								type="file"
								name="photos"
								accept="image/*"
								capture="environment"
								multiple
								className="sr-only"
								onChange={(event) => {
									addPhotos(event.target.files);
									event.target.value = "";
								}}
							/>

							{photoPreviews.length > 0 ? (
								<ul className="grid grid-cols-3 gap-2">
									{photoPreviews.map((photo) => (
										<li key={photo.id} className="relative aspect-square">
											<img
												src={photo.url}
												alt=""
												className="size-full rounded-lg border object-cover"
											/>
											<button
												type="button"
												onClick={() => removePhoto(photo.id)}
												className="absolute top-1 right-1 rounded-full bg-background/90 p-1 shadow-sm"
												aria-label="Remove photo"
											>
												<X className="size-3.5" />
											</button>
										</li>
									))}
								</ul>
							) : null}

							{photoPreviews.length < 5 ? (
								<div className="flex gap-2">
									<Button
										type="button"
										variant="outline"
										className="flex-1"
										onClick={() => photoInputRef.current?.click()}
									>
										<ImagePlus />
										Add photo
									</Button>
									<Button
										type="button"
										variant="outline"
										className="flex-1 sm:hidden"
										onClick={() => {
											const input = photoInputRef.current;
											if (input) {
												input.setAttribute("capture", "environment");
												input.click();
											}
										}}
									>
										<Camera />
										Take photo
									</Button>
								</div>
							) : null}
						</div>

						{reportAction && !reportAction.ok && reportAction.error ? (
							<Alert variant="destructive">
								<CircleAlert />
								<AlertTitle>Could not submit report</AlertTitle>
								<AlertDescription>{reportAction.error}</AlertDescription>
							</Alert>
						) : null}
					</CardContent>

					<CardFooter>
						<Button
							type="submit"
							size="lg"
							className="h-11 w-full"
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<>
									<Loader2 className="size-5 animate-spin" aria-hidden="true" />
									Submitting…
								</>
							) : (
								"Submit report"
							)}
						</Button>
					</CardFooter>
				</Form>
			</Card>
		</main>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Something went wrong.";

	if (isRouteErrorResponse(error)) {
		message =
			typeof error.data === "object" &&
			error.data &&
			"message" in error.data &&
			typeof error.data.message === "string"
				? error.data.message
				: error.statusText;
	}

	return (
		<main className="flex min-h-screen items-center justify-center px-4 py-16">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Report unavailable</CardTitle>
					<CardDescription>{message}</CardDescription>
				</CardHeader>
			</Card>
		</main>
	);
}

const inputClassName =
	"flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function Field({
	id,
	label,
	error,
	children,
}: {
	id: string;
	label: string;
	error?: string;
	children: ReactNode;
}) {
	return (
		<div className="space-y-1.5">
			<label htmlFor={id} className="text-sm font-medium">
				{label}
			</label>
			{children}
			{error ? <p className="text-xs text-destructive">{error}</p> : null}
		</div>
	);
}

import { useEffect, useState } from "react";
import { Link, useFetcher } from "react-router";
import {
	CircleAlert,
	Download,
	Loader2,
	LogOut,
	MapPin,
	Plus,
} from "lucide-react";
import QRCode from "qrcode";

import type { Route } from "./+types/owner.locations";
import { requireOwner } from "@/auth/auth-helpers.server";
import { authClient } from "@/auth/auth.client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { location, userLocation } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAppContext } from "@/context.server";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Locations" }];
}

function getReportUrl(appUrl: string, locationId: string) {
	return `${appUrl}/location/${locationId}/report`;
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const { user, db, impersonatedBy } = await requireOwner(context, request);
	const entries = await db.query.userLocation.findMany({
		where: eq(userLocation.userId, user.id),
		with: { location: true },
	});

	const locations = entries
		.map((entry) => entry.location)
		.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

	let impersonatorName: string | null = null;
	if (impersonatedBy) {
		const impersonator = await db.query.user.findFirst({
			where: (users, { eq: eqFn }) => eqFn(users.id, impersonatedBy),
		});
		impersonatorName = impersonator?.name ?? null;
	}

	const { env } = getAppContext(context);
	const appUrl = env.BETTER_AUTH_URL || new URL(request.url).origin;

	return {
		user,
		locations,
		appUrl,
		isImpersonating: Boolean(impersonatedBy),
		impersonatorName,
	};
}

export async function action({ context, request }: Route.ActionArgs) {
	const { user, db } = await requireOwner(context, request);
	const formData = await request.formData();
	const intent = formData.get("intent");

	if (intent === "create-location") {
		const name = String(formData.get("name") ?? "").trim();
		const address = String(formData.get("address") ?? "").trim();

		if (!name || !address) {
			return { error: "Name and address are required." };
		}

		const [newLocation] = await db
			.insert(location)
			.values({ name, address })
			.returning();

		await db.insert(userLocation).values({
			userId: user.id,
			locationId: newLocation.id,
		});

		return { success: true };
	}

	return { error: "Unknown action." };
}

async function downloadQrCode(url: string, filename: string) {
	const dataUrl = await QRCode.toDataURL(url, { width: 512, margin: 2 });
	const link = document.createElement("a");
	link.download = filename;
	link.href = dataUrl;
	link.click();
}

export default function OwnerLocationsPage({
	loaderData,
}: Route.ComponentProps) {
	const { user, locations, appUrl, isImpersonating, impersonatorName } =
		loaderData;
	const fetcher = useFetcher<typeof action>();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [isStopping, setIsStopping] = useState(false);
	const [downloadingId, setDownloadingId] = useState<string | null>(null);

	const isCreating =
		fetcher.state !== "idle" &&
		fetcher.formData?.get("intent") === "create-location";

	useEffect(() => {
		if (fetcher.data?.success) {
			setDialogOpen(false);
		}
	}, [fetcher.data?.success]);

	async function stopImpersonating() {
		setIsStopping(true);

		try {
			await authClient.admin.stopImpersonating();
			window.location.href = "/admin";
		} catch {
			setIsStopping(false);
		}
	}

	async function handleDownloadQr(locationId: string, locationName: string) {
		setDownloadingId(locationId);

		try {
			const url = getReportUrl(appUrl, locationId);
			const safeName = locationName
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, "");
			await downloadQrCode(url, `${safeName || "location"}-qr.png`);
		} finally {
			setDownloadingId(null);
		}
	}

	return (
		<div className="min-h-screen bg-background">
			{isImpersonating ? (
				<Alert className="rounded-none border-x-0 border-t-0">
					<AlertTitle>Impersonation active</AlertTitle>
					<AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<span>
							You are viewing locations as {user.name}
							{impersonatorName ? ` (admin: ${impersonatorName})` : ""}.
						</span>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={isStopping}
							onClick={stopImpersonating}
						>
							{isStopping ? <Loader2 className="animate-spin" /> : <LogOut />}
							Exit impersonation
						</Button>
					</AlertDescription>
				</Alert>
			) : null}

			<header className="border-b">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
					<div>
						<p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground/60 uppercase">
							Servisnik
						</p>
						<h1 className="text-xl font-semibold tracking-tight">Locations</h1>
					</div>
					<div className="flex items-center gap-3">
						<span className="text-sm text-muted-foreground">{user.name}</span>
						{!isImpersonating ? (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => authClient.signOut()}
							>
								Sign out
							</Button>
						) : null}
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-5xl px-4 py-8">
				<Card>
					<CardHeader className="flex flex-row items-start justify-between gap-4">
						<div>
							<CardTitle>Your locations</CardTitle>
							<CardDescription>
								Manage properties and download QR codes for issue reporting.
							</CardDescription>
						</div>

						<Dialog
							open={dialogOpen}
							onOpenChange={(open) => {
								setDialogOpen(open);
								if (!open && fetcher.data?.success) {
									fetcher.reset();
								}
							}}
						>
							<DialogTrigger
								render={
									<Button>
										<Plus data-icon="inline-start" />
										New location
									</Button>
								}
							/>
							<DialogContent className="sm:max-w-md">
								<DialogHeader>
									<DialogTitle>Create location</DialogTitle>
									<DialogDescription>
										Add a property location. A QR code will link visitors to the
										report page for that location.
									</DialogDescription>
								</DialogHeader>

								<fetcher.Form method="post" className="space-y-4">
									<input type="hidden" name="intent" value="create-location" />

									<div className="space-y-2">
										<Label htmlFor="name">Name</Label>
										<Input
											id="name"
											name="name"
											placeholder="Main building"
											required
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="address">Address</Label>
										<Input
											id="address"
											name="address"
											placeholder="123 Example Street"
											required
										/>
									</div>

									{fetcher.data?.error ? (
										<Alert variant="destructive">
											<CircleAlert />
											<AlertTitle>Could not create location</AlertTitle>
											<AlertDescription>{fetcher.data.error}</AlertDescription>
										</Alert>
									) : null}

									<DialogFooter>
										<Button
											type="button"
											variant="outline"
											onClick={() => setDialogOpen(false)}
										>
											Cancel
										</Button>
										<Button type="submit" disabled={isCreating}>
											{isCreating ? (
												<>
													<Loader2 className="animate-spin" />
													Creating…
												</>
											) : (
												"Create location"
											)}
										</Button>
									</DialogFooter>
								</fetcher.Form>
							</DialogContent>
						</Dialog>
					</CardHeader>

					<CardContent>
						{locations.length === 0 ? (
							<div className="flex flex-col items-center gap-3 py-12 text-center">
								<MapPin className="size-10 text-muted-foreground/40" />
								<p className="text-sm text-muted-foreground">
									No locations yet. Create one to get started.
								</p>
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Address</TableHead>
										<TableHead>Report link</TableHead>
										<TableHead className="text-right">QR code</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{locations.map((entry) => {
										const reportUrl = getReportUrl(appUrl, entry.id);

										return (
											<TableRow key={entry.id}>
												<TableCell className="font-medium">
													{entry.name}
												</TableCell>
												<TableCell>{entry.address}</TableCell>
												<TableCell>
													<a
														href={reportUrl}
														className="text-sm text-muted-foreground underline-offset-4 hover:underline"
														target="_blank"
														rel="noreferrer"
													>
														/location/{entry.id}/report
													</a>
												</TableCell>
												<TableCell className="text-right">
													<Button
														type="button"
														variant="outline"
														size="sm"
														disabled={downloadingId === entry.id}
														onClick={() =>
															handleDownloadQr(entry.id, entry.name)
														}
													>
														{downloadingId === entry.id ? (
															<Loader2 className="animate-spin" />
														) : (
															<Download />
														)}
														Download
													</Button>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>

				<p className="mt-6 text-center text-xs text-muted-foreground">
					<Link to="/owner" className="underline-offset-4 hover:underline">
						Back to dashboard
					</Link>
				</p>
			</main>
		</div>
	);
}

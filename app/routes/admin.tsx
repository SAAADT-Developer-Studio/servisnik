import { useEffect, useState } from "react";
import { Link, useFetcher, useNavigation } from "react-router";
import { CircleAlert, Loader2, Plus, UserCog } from "lucide-react";

import type { Route } from "./+types/admin";
import { requireAdmin } from "@/auth/auth-helpers.server";
import { authClient } from "@/auth/auth.client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Admin" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const { user: adminUser, db } = await requireAdmin(context, request);
	const owners = await db.query.user.findMany({
		where: eq(user.role, "OWNER"),
		orderBy: (users, { desc }) => [desc(users.createdAt)],
	});

	return { adminUser, owners };
}

export async function action({ context, request }: Route.ActionArgs) {
	const { auth } = await requireAdmin(context, request);
	const formData = await request.formData();
	const intent = formData.get("intent");

	if (intent === "create-owner") {
		const name = String(formData.get("name") ?? "").trim();
		const email = String(formData.get("email") ?? "").trim().toLowerCase();

		if (!name || !email) {
			return { error: "Name and email are required." };
		}

		try {
			await auth.api.createUser({
				body: {
					name,
					email,
					role: "OWNER",
				},
				headers: request.headers,
			});

			return { success: true };
		} catch {
			return { error: "Could not create owner. The email may already exist." };
		}
	}

	return { error: "Unknown action." };
}

export default function AdminPage({ loaderData }: Route.ComponentProps) {
	const { adminUser, owners } = loaderData;
	const fetcher = useFetcher<typeof action>();
	const navigation = useNavigation();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
	const [impersonateError, setImpersonateError] = useState<string | null>(null);

	const isCreating =
		fetcher.state !== "idle" &&
		fetcher.formData?.get("intent") === "create-owner";

	useEffect(() => {
		if (fetcher.data?.success) {
			setDialogOpen(false);
		}
	}, [fetcher.data?.success]);

	async function impersonateOwner(ownerId: string) {
		setImpersonateError(null);
		setImpersonatingId(ownerId);

		try {
			const result = await authClient.admin.impersonateUser({ userId: ownerId });

			if (result.error) {
				setImpersonateError(result.error.message ?? "Could not impersonate owner.");
				setImpersonatingId(null);
				return;
			}

			window.location.href = "/owner";
		} catch {
			setImpersonateError("Could not impersonate owner.");
			setImpersonatingId(null);
		}
	}

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
					<div>
						<p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground/60 uppercase">
							Servisnik
						</p>
						<h1 className="text-xl font-semibold tracking-tight">Admin</h1>
					</div>
					<div className="flex items-center gap-3">
						<span className="text-sm text-muted-foreground">{adminUser.name}</span>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => authClient.signOut()}
						>
							Sign out
						</Button>
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-5xl px-4 py-8">
				<Card>
					<CardHeader className="flex flex-row items-start justify-between gap-4">
						<div>
							<CardTitle>Owners</CardTitle>
							<CardDescription>
								Manage property owners and impersonate them to view their
								dashboard.
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
										New owner
									</Button>
								}
							/>
							<DialogContent className="sm:max-w-md">
								<DialogHeader>
									<DialogTitle>Create owner</DialogTitle>
									<DialogDescription>
										Add a new owner by email. They can sign in with Google using
										this address.
									</DialogDescription>
								</DialogHeader>

								<fetcher.Form method="post" className="space-y-4">
									<input type="hidden" name="intent" value="create-owner" />

									<div className="space-y-2">
										<Label htmlFor="name">Name</Label>
										<Input
											id="name"
											name="name"
											placeholder="Jane Smith"
											required
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="email">Email</Label>
										<Input
											id="email"
											name="email"
											type="email"
											placeholder="jane@example.com"
											required
										/>
									</div>

									{fetcher.data?.error ? (
										<Alert variant="destructive">
											<CircleAlert />
											<AlertTitle>Could not create owner</AlertTitle>
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
												"Create owner"
											)}
										</Button>
									</DialogFooter>
								</fetcher.Form>
							</DialogContent>
						</Dialog>
					</CardHeader>

					<CardContent className="space-y-4">
						{impersonateError ? (
							<Alert variant="destructive">
								<CircleAlert />
								<AlertTitle>Impersonation failed</AlertTitle>
								<AlertDescription>{impersonateError}</AlertDescription>
							</Alert>
						) : null}

						{owners.length === 0 ? (
							<p className="py-8 text-center text-sm text-muted-foreground">
								No owners yet. Create one to get started.
							</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{owners.map((owner) => (
										<TableRow key={owner.id}>
											<TableCell className="font-medium">{owner.name}</TableCell>
											<TableCell>{owner.email}</TableCell>
											<TableCell>
												{owner.banned ? (
													<Badge variant="destructive">Banned</Badge>
												) : (
													<Badge variant="secondary">Active</Badge>
												)}
											</TableCell>
											<TableCell className="text-right">
												<Button
													type="button"
													variant="outline"
													size="sm"
													disabled={
														impersonatingId === owner.id ||
														navigation.state !== "idle"
													}
													onClick={() => impersonateOwner(owner.id)}
												>
													{impersonatingId === owner.id ? (
														<Loader2 className="animate-spin" />
													) : (
														<UserCog />
													)}
													Impersonate
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>

				<p className="mt-6 text-center text-xs text-muted-foreground">
					<Link to="/" className="underline-offset-4 hover:underline">
						Back to home
					</Link>
				</p>
			</main>
		</div>
	);
}

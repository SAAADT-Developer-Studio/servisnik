import { Link } from "react-router";
import { Loader2, LogOut } from "lucide-react";
import { useState } from "react";

import type { Route } from "./+types/owner";
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
import { createDb } from "@/db/db.server";
import { eq } from "drizzle-orm";
import { userLocation } from "@/db/schema";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Owner Dashboard" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const { user, impersonatedBy } = await requireOwner(
		context.cloudflare.env,
		request,
	);
	const db = createDb(context.cloudflare.env.DATABASE_URL);
	const locations = await db.query.userLocation.findMany({
		where: eq(userLocation.userId, user.id),
		with: { location: true },
	});

	let impersonatorName: string | null = null;
	if (impersonatedBy) {
		const impersonator = await db.query.user.findFirst({
			where: (users, { eq: eqFn }) => eqFn(users.id, impersonatedBy),
		});
		impersonatorName = impersonator?.name ?? null;
	}

	return {
		user,
		locations: locations.map((entry) => entry.location),
		isImpersonating: Boolean(impersonatedBy),
		impersonatorName,
	};
}

export default function OwnerPage({ loaderData }: Route.ComponentProps) {
	const { user, locations, isImpersonating, impersonatorName } = loaderData;
	const [isStopping, setIsStopping] = useState(false);

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

			<header className="border-b">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
					<div>
						<p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground/60 uppercase">
							Servisnik
						</p>
						<h1 className="text-xl font-semibold tracking-tight">
							Owner dashboard
						</h1>
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
					<CardHeader>
						<CardTitle>Welcome, {user.name}</CardTitle>
						<CardDescription>
							This is the owner view. Ticket management will appear here.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{locations.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No locations assigned yet.
							</p>
						) : (
							<ul className="space-y-2">
								{locations.map((location) => (
									<li
										key={location.id}
										className="rounded-lg border bg-card px-4 py-3"
									>
										<p className="font-medium">{location.name}</p>
										<p className="text-sm text-muted-foreground">
											{location.address}
										</p>
									</li>
								))}
							</ul>
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

import { useState } from "react";
import { Link, redirect } from "react-router";
import { CircleAlert, Loader2 } from "lucide-react";

import type { Route } from "./+types/login";
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
import { authClient } from "../auth/auth.client";
import { createAuth } from "../auth/auth.server";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Sign in" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const auth = createAuth(context.cloudflare.env);
	const session = await auth.api.getSession({ headers: request.headers });

	if (session) {
		throw redirect("/");
	}

	return null;
}

export default function Login() {
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	async function signInWithGoogle() {
		setError(null);
		setIsLoading(true);

		try {
			await authClient.signIn.social({
				provider: "google",
				callbackURL: "/",
			});
		} catch {
			setError("Could not start Google sign-in. Try again.");
			setIsLoading(false);
		}
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--muted)_0%,var(--background)_55%)] px-4 py-16">
			<Card className="w-full max-w-sm shadow-sm">
				<CardHeader className="items-center gap-3 pb-1 text-center">
					<p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground/60 uppercase">
						Servisnik
					</p>
					<CardTitle className="text-3xl font-semibold tracking-tight">
						Sign in
					</CardTitle>
					<CardDescription className="text-sm leading-relaxed">
						Use your Google account to continue.
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-4">
					<Button
						type="button"
						variant="outline"
						size="lg"
						className="h-11 w-full"
						onClick={signInWithGoogle}
						disabled={isLoading}
					>
						{isLoading ? (
							<Loader2 className="size-5 animate-spin" aria-hidden="true" />
						) : (
							<GoogleIcon />
						)}
						{isLoading ? "Redirecting…" : "Continue with Google"}
					</Button>

					{error ? (
						<Alert variant="destructive">
							<CircleAlert />
							<AlertTitle>Sign-in failed</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : null}
				</CardContent>

				<CardFooter className="justify-center">
					<Link
						to="/"
						className="text-xs text-muted-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
					>
						Back to home
					</Link>
				</CardFooter>
			</Card>
		</main>
	);
}

function GoogleIcon() {
	return (
		<svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
			<path
				fill="#EA4335"
				d="M12 10.2v3.6h5.1c-.2 1.2-1.6 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.8 3.7 14.6 2.6 12 2.6 6.9 2.6 2.7 6.8 2.7 12s4.2 9.4 9.3 9.4c5.4 0 8.9-3.8 8.9-9.1 0-.6-.1-1.1-.2-1.5H12Z"
			/>
			<path
				fill="#34A853"
				d="M4.4 14.5 7 16.6c.9 2.4 3.1 4.1 5.9 4.1 1.8 0 3.3-.6 4.4-1.6l3.4 3.3c-2 1.9-4.6 3-7.8 3-5.1 0-9.3-3.8-9.3-9.4 0-1.5.4-3 1-4.2l-2.2-1.7Z"
			/>
			<path
				fill="#4A90E2"
				d="M2.7 7.8 5.5 10c.5-1.5 1.7-2.7 3.2-3.5L5.5 3.7C3.9 5.2 2.7 7.4 2.7 7.8Z"
			/>
			<path
				fill="#FBBC05"
				d="M12 22.4c2.7 0 5-1 6.7-2.7l-3.4-3.3c-.9.6-2.1 1-3.3 1-2.8 0-5.1-1.7-5.9-4.1l-2.6 2c1.2 3.5 4.6 6.1 8.5 6.1Z"
			/>
		</svg>
	);
}

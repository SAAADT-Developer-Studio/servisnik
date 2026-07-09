import { useState } from "react";
import { Link, redirect } from "react-router";

import type { Route } from "./+types/login";
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
		<main className="flex min-h-screen items-center justify-center px-4 py-16">
			<div className="w-full max-w-md rounded-3xl border border-gray-200 bg-surface p-8 shadow-sm dark:border-gray-700">
				<div className="space-y-2 text-center">
					<h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
						Sign in
					</h1>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Continue with your Google account to access Servisnik.
					</p>
				</div>

				<div className="mt-8 space-y-4">
					<button
						type="button"
						onClick={signInWithGoogle}
						disabled={isLoading}
						className="flex w-full items-center justify-center gap-3 rounded-2xl bg-surface-strong px-4 py-3 text-sm font-medium text-secondary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
					>
						<GoogleIcon />
						{isLoading ? "Redirecting..." : "Continue with Google"}
					</button>

					{error ? (
						<p className="text-center text-sm text-red-600 dark:text-red-400">
							{error}
						</p>
					) : null}
				</div>

				<p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
					<Link to="/" className="hover:underline">
						Back to home
					</Link>
				</p>
			</div>
		</main>
	);
}

function GoogleIcon() {
	return (
		<svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
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

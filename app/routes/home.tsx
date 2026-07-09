import { Link } from "react-router";

import type { Route } from "./+types/home";
import { authClient } from "../auth/auth.client";
import { createAuth } from "../auth/auth.server";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "New React Router App" },
		{ name: "description", content: "Welcome to React Router!" },
	];
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const auth = createAuth(context.cloudflare.env);
	const session = await auth.api.getSession({ headers: request.headers });

	return {
		message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE,
		user: session?.user ?? null,
	};
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const user = loaderData.user;

	return (
		<div>
			<header className="flex justify-end px-4 pt-4">
				{user ? (
					<div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
						{user.image ? (
							<img
								src={user.image}
								alt=""
								className="h-8 w-8 rounded-full"
							/>
						) : null}
						<span>{user.name}</span>
						<button
							type="button"
							onClick={() => authClient.signOut()}
							className="rounded-full border border-gray-300 px-3 py-1 hover:bg-surface-secondary dark:border-gray-600"
						>
							Sign out
						</button>
					</div>
				) : (
					<Link
						to="/login"
						className="rounded-full bg-surface-strong px-4 py-2 text-sm font-medium text-secondary hover:opacity-90"
					>
						Sign in
					</Link>
				)}
			</header>
			<Welcome message={loaderData.message} />
		</div>
	);
}

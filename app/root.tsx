import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLocation,
} from "react-router";

import type { Route } from "./+types/root";
import { getSessionUser } from "./auth/auth-helpers.server";
import { Navbar } from "./components/navbar";
import { Footer } from "./components/footer";
import { getOwnerPendingTicketCount } from "./tickets/tickets.server";
import "./app.css";

function getNavbarVariant(
	pathname: string,
): "landing" | "app" | null {
	if (pathname === "/") {
		return "landing";
	}

	if (pathname.startsWith("/admin") || pathname.startsWith("/owner")) {
		return "app";
	}

	return null;
}

function shouldShowFooter(pathname: string) {
	if (pathname === "/login" || pathname.includes("/report")) {
		return false;
	}

	return (
		pathname === "/" ||
		pathname.startsWith("/admin") ||
		pathname.startsWith("/owner")
	);
}

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
];

export async function loader({ context, request }: Route.LoaderArgs) {
	const session = await getSessionUser(context, request);

	if (!session) {
		return {
			user: null,
			pendingCount: 0,
			isImpersonating: false,
			impersonatorName: null,
		};
	}

	let pendingCount = 0;
	if (session.user.role === "OWNER") {
		pendingCount = await getOwnerPendingTicketCount(
			session.db,
			session.user.id,
		);
	}

	let impersonatorName: string | null = null;
	if (session.impersonatedBy) {
		const impersonator = await session.db.query.user.findFirst({
			where: (users, { eq: eqFn }) => eqFn(users.id, session.impersonatedBy!),
		});
		impersonatorName = impersonator?.name ?? null;
	}

	return {
		user: {
			name: session.user.name,
			email: session.user.email,
			role: session.user.role,
		},
		pendingCount,
		isImpersonating: Boolean(session.impersonatedBy),
		impersonatorName,
	};
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App({ loaderData }: Route.ComponentProps) {
	const location = useLocation();
	const navbarVariant = getNavbarVariant(location.pathname);
	const showFooter = shouldShowFooter(location.pathname);

	return (
		<div className="flex min-h-screen flex-col">
			{navbarVariant ? (
				<Navbar
					variant={navbarVariant}
					user={loaderData.user}
					pendingCount={loaderData.pendingCount}
					isImpersonating={loaderData.isImpersonating}
					impersonatorName={loaderData.impersonatorName}
				/>
			) : null}
			<div className="flex-1">
				<Outlet />
			</div>
			{showFooter ? <Footer user={loaderData.user} /> : null}
		</div>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}

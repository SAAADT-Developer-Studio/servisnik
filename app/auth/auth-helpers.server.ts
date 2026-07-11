import { eq } from "drizzle-orm";
import { redirect, type RouterContextProvider } from "react-router";

import { getAppContext } from "../context.server";
import { user } from "../db/schema";

export async function requireSession(
	context: Readonly<RouterContextProvider>,
	request: Request,
) {
	const { auth } = getAppContext(context);
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		const redirectTo = new URL(request.url).pathname;
		throw redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}

	return { auth, session };
}

export async function requireAdmin(
	context: Readonly<RouterContextProvider>,
	request: Request,
) {
	const { auth, session } = await requireSession(context, request);
	const { db } = getAppContext(context);
	const dbUser = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
	});

	if (!dbUser || dbUser.role !== "ADMIN") {
		throw new Response("Forbidden", { status: 403 });
	}

	return { auth, session, user: dbUser, db };
}

export async function requireOwner(
	context: Readonly<RouterContextProvider>,
	request: Request,
) {
	const { auth, session } = await requireSession(context, request);
	const { db } = getAppContext(context);
	const dbUser = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
	});

	if (!dbUser || dbUser.role !== "OWNER") {
		throw new Response("Forbidden", { status: 403 });
	}

	const impersonatedBy =
		"impersonatedBy" in session.session
			? (session.session.impersonatedBy as string | null | undefined)
			: null;

	return {
		auth,
		session,
		user: dbUser,
		db,
		impersonatedBy: impersonatedBy ?? null,
	};
}

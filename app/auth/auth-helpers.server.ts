import { eq } from "drizzle-orm";
import { redirect } from "react-router";

import { createDb } from "../db/db.server";
import { user } from "../db/schema";
import { createAuth } from "./auth.server";

export async function requireSession(env: Env, request: Request) {
	const auth = createAuth(env);
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		const redirectTo = new URL(request.url).pathname;
		throw redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}

	return { auth, session };
}

export async function requireAdmin(env: Env, request: Request) {
	const { auth, session } = await requireSession(env, request);
	const db = createDb(env.DATABASE_URL);
	const dbUser = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
	});

	if (!dbUser || dbUser.role !== "ADMIN") {
		throw new Response("Forbidden", { status: 403 });
	}

	return { auth, session, user: dbUser };
}

export async function requireOwner(env: Env, request: Request) {
	const { auth, session } = await requireSession(env, request);
	const db = createDb(env.DATABASE_URL);
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

	return { auth, session, user: dbUser, impersonatedBy: impersonatedBy ?? null };
}

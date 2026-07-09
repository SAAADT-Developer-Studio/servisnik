import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { createDb } from "../db/db.server";
import * as schema from "../db/schema";

export function createAuth(env: Env) {
	return betterAuth({
		secret: env.BETTER_AUTH_SECRET,
		database: drizzleAdapter(createDb(env.DATABASE_URL), {
			provider: "pg",
			schema,
		}),
		socialProviders: {
			google: {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
			},
		},
	});
}

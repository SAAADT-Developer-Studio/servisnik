import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";

import { createDb } from "../db/db.server";
import * as schema from "../db/schema";
import { ac, adminRole, ownerRole } from "./permissions.server";

export function createAuth(env: Env) {
	return betterAuth({
		baseURL: env.BETTER_AUTH_URL,
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
		user: {
			additionalFields: {
				role: {
					type: "string",
					required: true,
					defaultValue: "OWNER",
					input: false,
				},
			},
		},
		plugins: [
			admin({
				ac,
				roles: {
					ADMIN: adminRole,
					OWNER: ownerRole,
				},
				adminRoles: ["ADMIN"],
				defaultRole: "OWNER",
			}),
		],
	});
}

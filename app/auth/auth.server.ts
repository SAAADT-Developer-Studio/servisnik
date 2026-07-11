import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";

import type { Db } from "../db/db.server";
import * as schema from "../db/schema";
import { ac, adminRole, ownerRole } from "./permissions.server";

export function createAuth(env: Env, db: Db) {
	return betterAuth({
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		database: drizzleAdapter(db, {
			provider: "pg",
			schema,
		}),
		account: {
			accountLinking: {
				trustedProviders: ["google"],
			},
		},
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

export type Auth = ReturnType<typeof createAuth>;

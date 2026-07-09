import { createAccessControl } from "better-auth/plugins/access";

const statements = {
	user: [
		"create",
		"list",
		"set-role",
		"ban",
		"impersonate",
		"impersonate-admins",
		"delete",
		"set-password",
		"set-email",
		"get",
		"update",
	],
	session: ["list", "revoke", "delete"],
} as const;

export const ac = createAccessControl(statements);

export const adminRole = ac.newRole({
	user: [
		"create",
		"list",
		"set-role",
		"ban",
		"impersonate",
		"delete",
		"set-password",
		"set-email",
		"get",
		"update",
	],
	session: ["list", "revoke", "delete"],
});

export const ownerRole = ac.newRole({
	user: [],
	session: [],
});

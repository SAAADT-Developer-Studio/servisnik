import {
	type RouteConfig,
	index,
	prefix,
	route,
} from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("login", "routes/login.tsx"),
	...prefix("admin", [index("routes/admin.tsx")]),
	...prefix("owner", [
		index("routes/owner.tsx"),
		route("approvals", "routes/owner.approvals.tsx"),
		route("locations", "routes/owner.locations.tsx"),
	]),
	route(
		"location/:locationId/report",
		"routes/location.$locationId.report.tsx",
	),
	route("api/ticket-images/:imageId", "routes/api.ticket-images.$imageId.ts"),
	route("api/auth/*", "routes/api.auth.$.ts"),
] satisfies RouteConfig;

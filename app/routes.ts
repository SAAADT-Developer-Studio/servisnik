import {
	type RouteConfig,
	index,
	layout,
	prefix,
	route,
} from "@react-router/dev/routes";

export default [
	layout("layouts/landing-layout.tsx", [index("routes/home.tsx")]),
	layout("layouts/app-layout.tsx", [
		...prefix("admin", [index("routes/admin.tsx")]),
		...prefix("owner", [
			index("routes/owner.tsx"),
			route("requests", "routes/owner.requests.tsx"),
			route("locations", "routes/owner.locations.tsx"),
		]),
	]),
	route("login", "routes/login.tsx"),
	route(
		"location/:locationId/report",
		"routes/location.$locationId.report.tsx",
	),
	route("api/ticket-images/:imageId", "routes/api.ticket-images.$imageId.ts"),
	route("api/auth/*", "routes/api.auth.$.ts"),
] satisfies RouteConfig;

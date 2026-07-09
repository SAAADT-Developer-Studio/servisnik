import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("login", "routes/login.tsx"),
	route("admin", "routes/admin.tsx"),
	route("owner", "routes/owner.tsx"),
	route("location/:locationId/report", "routes/location.$locationId.report.tsx"),
	route("api/auth/*", "routes/api.auth.$.ts"),
] satisfies RouteConfig;

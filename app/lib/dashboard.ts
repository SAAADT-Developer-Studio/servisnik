import { href } from "react-router";

export function getDashboardHref(role: "ADMIN" | "OWNER") {
	return role === "ADMIN" ? href("/admin") : href("/owner");
}

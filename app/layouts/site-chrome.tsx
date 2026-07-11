import { Outlet, useRouteLoaderData } from "react-router";

import type { Route as RootRoute } from "../+types/root";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

type SiteChromeProps = {
	variant: "landing" | "app";
};

export function SiteChrome({ variant }: SiteChromeProps) {
	const rootData = useRouteLoaderData("root") as
		| RootRoute.ComponentProps["loaderData"]
		| undefined;

	return (
		<div className="flex min-h-screen flex-col">
			<Navbar
				variant={variant}
				user={rootData?.user ?? null}
				pendingCount={rootData?.pendingCount ?? 0}
				isImpersonating={rootData?.isImpersonating ?? false}
				impersonatorName={rootData?.impersonatorName ?? null}
			/>
			<div className="flex-1">
				<Outlet />
			</div>
			<Footer user={rootData?.user ?? null} />
		</div>
	);
}

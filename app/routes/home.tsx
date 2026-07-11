import {
	Clock,
	Settings,
	ShieldCheck,
	Zap,
} from "lucide-react";
import { Link, useRouteLoaderData } from "react-router";

import type { Route } from "./+types/home";
import type { Route as RootRoute } from "../+types/root";
import demoScreenshot from "@/assets/demo.png";
import { getDashboardHref } from "@/components/navbar";
import { Button } from "@/components/ui/button";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Servisnik — vse vzdrževanje na enem mestu" },
		{
			name: "description",
			content:
				"Servisnik omogoča enostavno prijavo napak, dodeljevanje opravil odgovornim osebam ter spremljanje izvedbe od prijave do zaključka.",
		},
	];
}

const highlights = [
	{ icon: Zap, label: "Brez namestitve" },
	{ icon: ShieldCheck, label: "Brez obveznosti" },
	{ icon: Clock, label: "Preizkusite takoj" },
] as const;

export default function HomePage() {
	const rootData = useRouteLoaderData("root") as RootRoute.ComponentProps["loaderData"];
	const user = rootData?.user ?? null;
	const tryHref = user ? getDashboardHref(user.role) : "/login";

	return (
		<div className="min-h-full bg-white">
			<main>
				<section
					id="funkcionalnosti"
					aria-labelledby="hero-heading"
					className="mx-auto max-w-screen-2xl scroll-mt-24 px-4 pt-6 pb-20 sm:px-6 sm:pt-8 lg:px-12 lg:pt-8 lg:pb-28"
				>
					<div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
						<div>
							<div className="mb-6 inline-flex items-center gap-2 rounded-md border border-border bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm">
								<Settings
									className="size-4 text-foreground"
									strokeWidth={2}
									aria-hidden="true"
								/>
								<span className="text-xs font-semibold tracking-[0.12em] text-foreground uppercase">
									Program za enostavno upravljanje vzdrževanja
								</span>
							</div>

							<h1
								id="hero-heading"
								className="text-[3rem] leading-[1.04] font-bold tracking-[-0.03em] text-balance text-foreground sm:text-6xl lg:text-[4.25rem] lg:leading-[1.05] xl:text-7xl"
							>
								vse vzdrževanje na enem mestu.
							</h1>

							<p className="mt-5 max-w-2xl text-xl leading-8 text-muted-foreground sm:mt-6 sm:text-[1.375rem] sm:leading-9 lg:text-2xl lg:leading-10">
								Servisnik omogoča enostavno prijavo napak, dodeljevanje opravil
								odgovornim osebam ter spremljanje izvedbe od prijave do
								zaključka.
							</p>

							<div className="mt-8 flex flex-col items-start gap-4 sm:mt-10">
								<Button
									className="inline-flex h-auto min-h-16 items-center justify-center gap-3 rounded-md bg-foreground px-12 py-5 text-lg font-semibold leading-none text-background hover:bg-foreground/90 sm:text-xl"
									render={<Link to={tryHref} />}
								>
									Preizkusi Servisnik
									<span aria-hidden="true">→</span>
								</Button>
							</div>

							<ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
								{highlights.map((item) => (
									<li
										key={item.label}
										className="flex items-center gap-2.5 text-base text-foreground sm:text-lg"
									>
										<item.icon
											className="size-5 text-foreground"
											strokeWidth={1.75}
											aria-hidden="true"
										/>
										{item.label}
									</li>
								))}
							</ul>
						</div>

						<div className="w-full">
							<img
								src={demoScreenshot}
								alt="Predogled nadzorne plošče Servisnik"
								className="w-full"
								width={1200}
								height={900}
							/>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}

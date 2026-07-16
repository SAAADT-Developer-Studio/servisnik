import { useState } from "react";
import { getDashboardHref } from "@/lib/dashboard";
import { href, Link, redirect, useSearchParams } from "react-router";
import {
	BarChart3,
	CircleAlert,
	ClipboardList,
	Loader2,
	Settings,
	Wrench,
} from "lucide-react";

import type { Route } from "./+types/login";
import mascotLogin from "@/assets/servisnik-login.png";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "../auth/auth-helpers.server";
import { authClient } from "../auth/auth.client";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Prijava — Servisnik" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const session = await getSessionUser(context, request);

	if (session) {
		const url = new URL(request.url);
		const redirectTo = url.searchParams.get("redirectTo");
		if (redirectTo?.startsWith("/")) {
			throw redirect(redirectTo);
		}

		throw redirect(getDashboardHref(session.user.role));
	}

	return null;
}

const features = [
	{
		icon: ClipboardList,
		title: "Hitra prijava napake",
		description: "Par klikov in že je oddano.",
	},
	{
		icon: Wrench,
		title: "Dodelite opravila",
		description: "Prava naloga, pravi mojster.",
	},
	{
		icon: BarChart3,
		title: "Spremljajte izvedbo",
		description: "Vedno vemo, kje smo.",
	},
] as const;

export default function Login() {
	const [searchParams] = useSearchParams();
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const redirectTo = searchParams.get("redirectTo");
	const callbackURL =
		redirectTo?.startsWith("/")
			? `${href("/login")}?redirectTo=${encodeURIComponent(redirectTo)}`
			: href("/login");

	async function signInWithGoogle() {
		setError(null);
		setIsLoading(true);

		try {
			await authClient.signIn.social({
				provider: "google",
				callbackURL,
			});
		} catch {
			setError("Prijava z Google računom ni uspela. Poskusite znova.");
			setIsLoading(false);
		}
	}

	return (
		<main className="grid h-screen overflow-hidden lg:grid-cols-2">
			<section
				aria-hidden="true"
				className="relative hidden h-screen overflow-hidden bg-[#0b1120] lg:block"
			>
				<div
					className="pointer-events-none absolute inset-0"
					style={{
						backgroundImage:
							"radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
						backgroundSize: "28px 28px",
					}}
				/>

				<div className="relative z-10 px-12 pt-16 xl:px-16">
					<div className="max-w-sm space-y-4">
						<h2 className="text-[2.25rem] leading-[1.12] font-bold tracking-[-0.03em] text-white">
							Vse vzdrževanje{" "}
							<span className="text-[#ff8c00]">na enem mestu.</span>
						</h2>
						<p className="text-[15px] leading-relaxed text-white/55">
							Prijavite napake, dodelite opravila in spremljajte izvedbo — brez
							papirjev in brez zmede.
						</p>
					</div>

					<div className="mt-8 flex items-start gap-2">
						<ul className="max-w-sm shrink-0 space-y-4">
							{features.map((feature) => (
								<li key={feature.title} className="flex items-start gap-4">
									<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/6 ring-1 ring-white/10">
										<feature.icon
											className="size-[18px] text-[#ff8c00]"
											strokeWidth={2}
											aria-hidden="true"
										/>
									</span>
									<div className="pt-0.5">
										<p className="text-[15px] font-semibold text-white">
											{feature.title}
										</p>
										<p className="mt-0.5 text-sm text-white/45">
											{feature.description}
										</p>
									</div>
								</li>
							))}
						</ul>

						<div className="relative -mt-4 shrink-0">
							<div
								aria-hidden="true"
								className="pointer-events-none absolute bottom-4 left-1/2 size-20 -translate-x-1/2 rounded-full bg-[#ff8c00]/30 blur-2xl"
							/>
							<img
								src={mascotLogin}
								alt=""
								className="relative ml-8 mt-5 h-[min(400px,45vh)] w-auto"
								style={{ mixBlendMode: "lighten" }}
							/>
						</div>
					</div>
				</div>
			</section>

			<section className="relative flex h-screen flex-col items-center justify-center overflow-hidden bg-[#f8f9fb] px-5 py-12 sm:px-8">
				<div
					className="pointer-events-none absolute inset-0"
					style={{
						backgroundImage:
							"radial-gradient(circle, rgba(15,23,42,0.05) 1px, transparent 1px)",
						backgroundSize: "28px 28px",
					}}
					aria-hidden="true"
				/>
				<Settings
					className="pointer-events-none absolute top-6 right-6 size-36 text-foreground/4"
					strokeWidth={1}
					aria-hidden="true"
				/>

				<div className="relative w-full max-w-[360px]">
					<div className="mb-10 space-y-2 text-center">
						<h1 className="text-[2rem] font-bold tracking-[-0.03em] text-foreground">
							Prijava
						</h1>
						<p className="text-sm text-muted-foreground">
							Nadaljujte z Google računom.
						</p>
					</div>

					<div className="space-y-4">
						<Button
							type="button"
							variant="outline"
							size="lg"
							className="h-[52px] w-full rounded-full border-border/80 bg-white text-[15px] font-medium shadow-sm transition-shadow hover:bg-white hover:shadow-md"
							onClick={signInWithGoogle}
							disabled={isLoading}
						>
							{isLoading ? (
								<Loader2 className="size-5 animate-spin" aria-hidden="true" />
							) : (
								<GoogleIcon />
							)}
							{isLoading ? "Preusmerjanje…" : "Nadaljuj z Google"}
						</Button>

						{error ? (
							<Alert variant="destructive">
								<CircleAlert />
								<AlertTitle>Prijava ni uspela</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						) : null}
					</div>

					<div className="relative my-8">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-border/60" />
						</div>
						<div className="relative flex justify-center">
							<span className="flex size-7 items-center justify-center rounded-full bg-[#f8f9fb] text-xs text-muted-foreground/60 ring-1 ring-border/50">
								ali
							</span>
						</div>
					</div>

					<p className="text-center">
						<Link
							to="/"
							className="text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							Nazaj na domačo stran
						</Link>
					</p>
				</div>
			</section>
		</main>
	);
}

function GoogleIcon() {
	return (
		<svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
			<path
				fill="#EA4335"
				d="M12 10.2v3.6h5.1c-.2 1.2-1.6 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.8 3.7 14.6 2.6 12 2.6 6.9 2.6 2.7 6.8 2.7 12s4.2 9.4 9.3 9.4c5.4 0 8.9-3.8 8.9-9.1 0-.6-.1-1.1-.2-1.5H12Z"
			/>
			<path
				fill="#34A853"
				d="M4.4 14.5 7 16.6c.9 2.4 3.1 4.1 5.9 4.1 1.8 0 3.3-.6 4.4-1.6l3.4 3.3c-2 1.9-4.6 3-7.8 3-5.1 0-9.3-3.8-9.3-9.4 0-1.5.4-3 1-4.2l-2.2-1.7Z"
			/>
			<path
				fill="#4A90E2"
				d="M2.7 7.8 5.5 10c.5-1.5 1.7-2.7 3.2-3.5L5.5 3.7C3.9 5.2 2.7 7.4 2.7 7.8Z"
			/>
			<path
				fill="#FBBC05"
				d="M12 22.4c2.7 0 5-1 6.7-2.7l-3.4-3.3c-.9.6-2.1 1-3.3 1-2.8 0-5.1-1.7-5.9-4.1l-2.6 2c1.2 3.5 4.6 6.1 8.5 6.1Z"
			/>
		</svg>
	);
}

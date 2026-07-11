import { Link } from "react-router";

import type { NavbarUser } from "@/components/navbar";

type FooterProps = {
	user: NavbarUser | null;
};

export function Footer({ user }: FooterProps) {
	const year = new Date().getFullYear();

	const navLinks =
		user?.role === "ADMIN"
			? [{ to: "/admin", label: "Owners" }]
			: user?.role === "OWNER"
				? [
						{ to: "/owner", label: "Nadzorna plošča" },
						{ to: "/owner/approvals", label: "Odobritve" },
						{ to: "/owner/locations", label: "Lokacije" },
					]
				: [{ to: "/login", label: "Prijava" }];

	return (
		<footer
			id="kontakt"
			className="relative mt-auto scroll-mt-24 overflow-hidden border-t border-white/10 bg-foreground text-background"
		>
			<div
				className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(255,255,255,0.1)_0%,transparent_55%),radial-gradient(ellipse_at_100%_100%,rgba(148,163,184,0.12)_0%,transparent_45%)]"
				aria-hidden="true"
			/>
			<div
				className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:32px_32px]"
				aria-hidden="true"
			/>
			<p
				className="pointer-events-none absolute -right-2 bottom-0 select-none text-[clamp(5rem,18vw,11rem)] font-semibold leading-none tracking-[-0.06em] text-white/[0.04]"
				aria-hidden="true"
			>
				SERVISNIK
			</p>

			<div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-16">
				<div className="grid gap-12 lg:grid-cols-[1.35fr_0.9fr_1fr] lg:gap-10">
					<div>
						<Link
							to="/"
							className="inline-block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-background"
						>
							<p className="font-mono text-xs font-medium tracking-[0.18em] text-background/45 uppercase">
								Servisnik
							</p>
						</Link>
						<p className="mt-5 max-w-sm text-sm leading-7 text-background/70">
							Poveže uporabnike objekta, odgovorne osebe in vzdrževalce v
							preprost potek — od prijave napake do opravljenega dela.
						</p>
					</div>

					<div>
						<p className="font-mono text-xs font-medium tracking-[0.18em] text-background/45 uppercase">
							Navigacija
						</p>
						<ul className="mt-4 space-y-2.5">
							{navLinks.map((link) => (
								<li key={link.to}>
									<Link
										to={link.to}
										className="text-sm text-background/75 transition-colors hover:text-background"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<p className="font-mono text-xs font-medium tracking-[0.18em] text-background/45 uppercase">
							Začni
						</p>
					</div>
				</div>

				<div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-xs text-background/50">
						© {year} Servisnik. Vse pravice pridržane.
					</p>
					<p className="font-mono text-[10px] tracking-[0.2em] text-background/40 uppercase">
						Vzdrževanje objektov
					</p>
				</div>
			</div>
		</footer>
	);
}

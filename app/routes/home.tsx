import {
	ArrowRight,
	Check,
	ClipboardCheck,
	Home,
	MapPin,
	QrCode,
	Wrench,
} from "lucide-react";

import type { Route } from "./+types/home";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Servisnik — vzdrževanje brez ugibanja" },
		{
			name: "description",
			content:
				"Prijava napak, odobritve in pregled vzdrževalnih opravil na enem mestu.",
		},
	];
}

const steps = [
	{
		icon: QrCode,
		title: "Skeniraj",
		description: "Obiskovalec prijavi napako prek QR kode.",
	},
	{
		icon: ClipboardCheck,
		title: "Odobri",
		description: "Odgovorna oseba pregleda zahtevo.",
	},
	{
		icon: Wrench,
		title: "Odpravi",
		description: "Ekipa spremlja opravilo do zaključka.",
	},
];

export default function HomePage() {
	return (
		<div className="min-h-screen overflow-hidden bg-background">
			<header className="border-b bg-background/90">
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
					<a
						href="/"
						className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
					>
						<span className="relative flex size-8 items-center justify-center">
							<Home className="size-7" strokeWidth={1.75} />
							<Wrench
								className="absolute -right-0.5 -bottom-0.5 size-3.5"
								strokeWidth={2}
							/>
						</span>
						<span className="text-lg font-semibold tracking-tight">
							servisnik
						</span>
					</a>

					<Button render={<a href="/login" />}>Prijava</Button>
				</div>
			</header>

			<main>
				<section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-20 lg:grid-cols-[1fr_1.05fr] lg:gap-20 lg:pt-24">
					<div>
						<p className="mb-5 font-mono text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
							Vzdrževanje objektov
						</p>
						<h1 className="max-w-2xl text-5xl leading-[0.96] font-semibold tracking-[-0.055em] text-balance sm:text-6xl lg:text-7xl">
							Od prijave napake do opravljenega dela.
						</h1>
						<p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">
							Servisnik poveže uporabnike objekta, odgovorne osebe in
							vzdrževalce v preprost potek brez izgubljenih sporočil.
						</p>

						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Button
								size="lg"
								className="h-11 px-5"
								render={<a href="/login" />}
							>
								Odpri Servisnik
								<ArrowRight data-icon="inline-end" />
							</Button>
							<a
								href="#potek"
								className="inline-flex h-11 items-center justify-center rounded-lg border bg-background px-5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2"
							>
								Poglej, kako deluje
							</a>
						</div>

						<ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
							{["Brez aplikacije za prijavitelje", "Deluje na telefonu"].map(
								(item) => (
									<li key={item} className="flex items-center gap-1.5">
										<Check className="size-3.5" aria-hidden="true" />
										{item}
									</li>
								),
							)}
						</ul>
					</div>

					<div className="relative mx-auto w-full max-w-xl">
						<div
							className="absolute -inset-8 -z-10 rounded-[3rem] bg-muted/70 blur-2xl"
							aria-hidden="true"
						/>
						<Card className="gap-0 bg-background py-0 shadow-2xl shadow-foreground/10">
							<div className="flex items-center justify-between border-b px-5 py-4">
								<div>
									<p className="text-xs text-muted-foreground">Danes</p>
									<p className="font-semibold">Pregled opravil</p>
								</div>
								<span className="rounded-full bg-muted px-3 py-1 font-mono text-xs">
									4 odprta
								</span>
							</div>

							<div className="grid gap-3 p-4 sm:grid-cols-3">
								<BoardColumn title="Novo" count={2}>
									<Ticket
										title="Pušča pipa v kuhinji"
										location="Enota Center · 2. nadstropje"
									/>
									<Ticket
										title="Luč na hodniku ne deluje"
										location="Enota Bežigrad · vhod"
									/>
								</BoardColumn>
								<BoardColumn title="V delu" count={1}>
									<Ticket
										title="Pregled prezračevanja"
										location="Enota Center · streha"
									/>
								</BoardColumn>
								<BoardColumn title="Končano" count={1}>
									<Ticket
										title="Menjava ključavnice"
										location="Enota Vič · pisarna"
										done
									/>
								</BoardColumn>
							</div>
						</Card>

						<div className="absolute -right-3 -bottom-7 flex items-center gap-3 rounded-xl border bg-background p-3 shadow-lg sm:right-8">
							<span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
								<QrCode className="size-5" />
							</span>
							<div>
								<p className="text-xs text-muted-foreground">Nova prijava</p>
								<p className="text-sm font-medium">Soba 204</p>
							</div>
						</div>
					</div>
				</section>

				<section id="potek" className="border-t bg-card/50">
					<div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
						<div className="mb-10 max-w-xl">
							<p className="font-mono text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
								En jasen potek
							</p>
							<h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
								Vsak ve, kaj sledi.
							</h2>
						</div>

						<div className="grid gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-3">
							{steps.map((step) => (
								<div key={step.title} className="bg-background p-6 sm:p-8">
									<step.icon className="mb-8 size-6" strokeWidth={1.75} />
									<h3 className="text-lg font-semibold">{step.title}</h3>
									<p className="mt-2 leading-6 text-muted-foreground">
										{step.description}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}

function BoardColumn({
	title,
	count,
	children,
}: {
	title: string;
	count: number;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-xl bg-muted/60 p-2.5">
			<div className="mb-2.5 flex items-center justify-between px-1">
				<p className="text-xs font-medium">{title}</p>
				<span className="font-mono text-[10px] text-muted-foreground">
					{count}
				</span>
			</div>
			<div className="space-y-2">{children}</div>
		</div>
	);
}

function Ticket({
	title,
	location,
	done = false,
}: {
	title: string;
	location: string;
	done?: boolean;
}) {
	return (
		<div className="rounded-lg border bg-background p-3 shadow-xs">
			<div className="mb-3 flex items-start justify-between gap-2">
				<p className="text-xs leading-4 font-medium">{title}</p>
				<span
					className={`mt-1 size-2 shrink-0 rounded-full ${
						done ? "bg-muted-foreground/40" : "bg-foreground"
					}`}
				/>
			</div>
			<p className="flex items-center gap-1 text-[10px] leading-4 text-muted-foreground">
				<MapPin className="size-3 shrink-0" />
				{location}
			</p>
		</div>
	);
}

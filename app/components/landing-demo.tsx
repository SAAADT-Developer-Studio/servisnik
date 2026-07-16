import {
	useEffect,
	useEffectEvent,
	useRef,
	useState,
	type PointerEvent as ReactPointerEvent,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
	Camera,
	CheckCircle2,
	ClipboardCheck,
	QrCode,
	Send,
	Wrench,
} from "lucide-react";

import demoStep1 from "@/assets/demo-step-1.png";
import demoStep2 from "@/assets/demo-step-2.png";
import demoStep3 from "@/assets/demo-step-3.png";
import demoStep4 from "@/assets/demo-step-4.png";
import demoStep5 from "@/assets/demo-step-5.png";
import demoStep6 from "@/assets/demo-step-6.png";
import { useHydrated } from "@/hooks/use-hydrated";

function useInView<T extends HTMLElement>(
	threshold = 0.28,
	rootMargin = "0px 0px -8% 0px",
) {
	const ref = useRef<T>(null);
	const hydrated = useHydrated();
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const node = ref.current;
		if (!node) return;

		const reduceMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		if (reduceMotion) {
			setVisible(true);
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{ threshold, rootMargin },
		);

		observer.observe(node);

		return () => observer.disconnect();
	}, [threshold, rootMargin]);

	const state = !hydrated ? "pending" : visible ? "visible" : "hidden";

	return { ref, state } as const;
}

function DemoStepImage({
	src,
	alt,
	state,
}: {
	src: string;
	alt: string;
	state: "pending" | "hidden" | "visible";
}) {
	const frameRef = useRef<HTMLDivElement>(null);
	const [tilt, setTilt] = useState({ x: 0, y: 0 });

	const onPointerMove = useEffectEvent((event: ReactPointerEvent) => {
		const frame = frameRef.current;
		if (!frame || state !== "visible") return;

		const rect = frame.getBoundingClientRect();
		const px = (event.clientX - rect.left) / rect.width;
		const py = (event.clientY - rect.top) / rect.height;

		setTilt({
			x: (0.5 - py) * 10,
			y: (px - 0.5) * 12,
		});
	});

	const onPointerLeave = useEffectEvent(() => {
		setTilt({ x: 0, y: 0 });
	});

	return (
		<div
			ref={frameRef}
			className="demo-step-image-frame group/image relative flex w-full justify-center perspective-distant"
			onPointerMove={onPointerMove}
			onPointerLeave={onPointerLeave}
		>
			<div
				className="demo-step-image-stage relative w-fit max-w-full overflow-hidden rounded-md will-change-transform"
				style={{
					transform:
						state === "visible"
							? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
							: undefined,
				}}
			>
				<img
					src={src}
					alt={alt}
					width={1086}
					height={1448}
					loading="lazy"
					className="demo-step-image relative z-10 block h-auto max-h-[min(34rem,58svh)] w-auto max-w-full rounded-md object-contain sm:max-h-[min(38rem,64svh)] lg:max-h-[min(42rem,calc(100svh-10rem))]"
				/>
				<div
					className="demo-step-image-shine pointer-events-none absolute inset-0 z-20 rounded-md"
					aria-hidden="true"
				/>
			</div>
		</div>
	);
}

function DemoStep({
	step,
	title,
	description,
	image,
	imageAlt,
	calloutIcon: CalloutIcon,
	calloutTitle,
	calloutSubtitle,
}: {
	step: number;
	title: string;
	description: string;
	image: string;
	imageAlt: string;
	calloutIcon: LucideIcon;
	calloutTitle: string;
	calloutSubtitle: string;
}) {
	const { ref, state } = useInView<HTMLElement>();

	return (
		<section
			ref={ref}
			aria-labelledby={`demo-step-${step}-heading`}
			className="scroll-mt-24"
			data-demo-state={state}
		>
			<div className="mx-auto flex max-w-screen-2xl items-center px-4 py-6 sm:px-6 sm:py-8 lg:min-h-[calc(100svh-5.5rem)] lg:px-12 lg:py-10">
				<div className="demo-step-card grid w-full items-center gap-8 rounded-[1.75rem] border border-border/70 bg-white p-6 shadow-[0_12px_40px_-18px_rgba(15,23,42,0.18)] sm:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:p-12">
					<div className="flex flex-col justify-center">
						<span
							className="demo-step-badge relative flex size-12 items-center justify-center rounded-full bg-brand text-lg font-bold text-brand-foreground sm:size-14 sm:text-xl"
							aria-hidden="true"
						>
							<span
								className="demo-step-badge-ring absolute inset-0 rounded-full"
								aria-hidden="true"
							/>
							{step}
						</span>

						<h3
							id={`demo-step-${step}-heading`}
							className="demo-step-title mt-6 text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-tight"
						>
							{title}
						</h3>

						<div
							className="demo-step-rule mt-4 h-1 w-12 origin-left rounded-full bg-brand"
							aria-hidden="true"
						/>

						<p className="demo-step-copy mt-5 max-w-md text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
							{description}
						</p>

						<div className="demo-step-callout mt-10 flex items-start gap-3.5">
							<span className="demo-step-callout-icon flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand/10">
								<CalloutIcon
									className="size-5 text-brand"
									strokeWidth={2}
									aria-hidden="true"
								/>
							</span>
							<div>
								<p className="text-sm font-semibold text-foreground sm:text-base">
									{calloutTitle}
								</p>
								<p className="mt-0.5 text-sm text-muted-foreground sm:text-[0.9375rem]">
									{calloutSubtitle}
								</p>
							</div>
						</div>
					</div>

					<div>
						<DemoStepImage src={image} alt={imageAlt} state={state} />
					</div>
				</div>
			</div>
		</section>
	);
}

const steps = [
	{
		step: 1,
		title: "Skenirajte QR kodo",
		description:
			"Na lokaciji skenirajte QR kodo in takoj odprite obrazec za prijavo težave — brez namestitve.",
		image: demoStep1,
		imageAlt: "Uporabnica skenira QR kodo Servisnik na steni",
		calloutIcon: QrCode,
		calloutTitle: "Hitro. Enostavno. Brez aplikacije.",
		calloutSubtitle: "Deluje v vseh brskalnikih.",
	},
	{
		step: 2,
		title: "Fotografirajte težavo",
		description:
			"Posnemite fotografijo napake, da odgovorne osebe takoj vidijo, kaj je narobe.",
		image: demoStep2,
		imageAlt: "Uporabnica fotografira puščajoči pralni stroj",
		calloutIcon: Camera,
		calloutTitle: "Jasna slika težave.",
		calloutSubtitle: "Manj ugibanja, hitrejši odziv.",
	},
	{
		step: 3,
		title: "Pošljite prijavo",
		description:
			"Dodajte kratek opis in pošljite zahtevek. Prijava je oddana v nekaj trenutkih.",
		image: demoStep3,
		imageAlt: "Oddaja prijave težave v aplikaciji Servisnik",
		calloutIcon: Send,
		calloutTitle: "Oddano v nekaj sekundah.",
		calloutSubtitle: "Brez telefonskih klicev in e-pošte.",
	},
	{
		step: 4,
		title: "Odobritev upravnika",
		description:
			"Upravnik pregleda zahtevek, ga odobri in samodejno pošlje serviserju.",
		image: demoStep4,
		imageAlt: "Upravnik odobri zahtevek na prenosniku",
		calloutIcon: ClipboardCheck,
		calloutTitle: "Pregled in odobritev na enem mestu.",
		calloutSubtitle: "Serviser je obveščen takoj.",
	},
	{
		step: 5,
		title: "Popravilo v teku",
		description:
			"Serviser prejme nalogo in odpravi težavo neposredno na lokaciji.",
		image: demoStep5,
		imageAlt: "Serviser popravlja puščajoči pralni stroj",
		calloutIcon: Wrench,
		calloutTitle: "Delo na lokaciji, sledljivo v sistemu.",
		calloutSubtitle: "Status je vedno posodobljen.",
	},
	{
		step: 6,
		title: "Zahtevek zaključen",
		description:
			"Ko je delo opravljeno, upravnik zaključi zahtevek — celoten potek ostane sledljiv.",
		image: demoStep6,
		imageAlt: "Upravnik zaključi zahtevek na nadzorni plošči",
		calloutIcon: CheckCircle2,
		calloutTitle: "Celoten potek ostane zabeležen.",
		calloutSubtitle: "Od prijave do zaključka.",
	},
] as const;

function DemoHeader() {
	const { ref, state } = useInView<HTMLElement>(0.4);

	return (
		<header
			ref={ref}
			data-demo-state={state}
			className="mx-auto max-w-screen-2xl px-4 pt-14 text-center sm:px-6 sm:pt-16 lg:px-12 lg:pt-20"
		>
			<p className="demo-header-eyebrow text-xs font-semibold tracking-[0.14em] text-brand uppercase">
				Kako deluje
			</p>
			<h2 className="demo-header-title mt-2.5 text-2xl font-bold tracking-[-0.03em] text-balance text-foreground sm:text-3xl lg:text-[2.25rem] lg:leading-tight">
				Od QR kode do opravljenega popravila
			</h2>
			<p className="demo-header-copy mx-auto mt-3 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
				Šest korakov od prijave težave do zaključenega zahtevka — jasno za
				uporabnike, upravnike in serviserje.
			</p>
		</header>
	);
}

export function LandingDemo() {
	return (
		<div id="kako-deluje" className="scroll-mt-24 bg-[#eef1f5]">
			<DemoHeader />

			<div className="pt-6 pb-16 sm:pt-8 sm:pb-20 lg:pb-28">
				{steps.map((item) => (
					<DemoStep key={item.step} {...item} />
				))}
			</div>
		</div>
	);
}

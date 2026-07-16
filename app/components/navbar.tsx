import { useEffect, useState } from "react";
import { Link, NavLink, useRevalidator } from "react-router";
import {
	ChevronDown,
	ClipboardList,
	Home,
	LogOut,
	MapPin,
	Menu,
	Users,
	X,
} from "lucide-react";

import { authClient } from "@/auth/auth.client";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoWithText from "@/assets/logo-with-text.png";
import { cn } from "@/lib/utils";

export type NavbarUser = {
	name: string;
	email: string;
	role: "ADMIN" | "OWNER";
};

export function Profile({ user }: { user: NavbarUser }) {
	const revalidator = useRevalidator();
	const initial = user.name.trim().charAt(0).toUpperCase() || "?";

	async function handleSignOut() {
		await authClient.signOut();
		void revalidator.revalidate();
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="group flex items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 outline-none">
				<span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-foreground text-sm font-semibold text-background">
					{initial}
				</span>
				<ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-popup-open:rotate-180" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-60 overflow-hidden p-0">
				<div className="border-b bg-background px-4 py-3">
					<div className="flex items-center gap-3">
						<span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-foreground text-sm font-semibold text-background">
							{initial}
						</span>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-semibold leading-snug">
								{user.name}
							</p>
							<p className="truncate text-xs text-muted-foreground">
								{user.email}
							</p>
						</div>
					</div>
				</div>
				<div className="p-1">
					<DropdownMenuItem
						className="gap-2.5 px-3 py-2.5 text-foreground hover:bg-muted focus:bg-muted data-highlighted:bg-muted"
						onClick={() => void handleSignOut()}
					>
						<LogOut />
						Odjava
					</DropdownMenuItem>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

type NavbarProps = {
	variant?: "landing" | "app";
	user?: NavbarUser | null;
	pendingCount?: number;
	isImpersonating?: boolean;
	impersonatorName?: string | null;
};

const ADMIN_LINKS = [{ to: "/admin", label: "Owners", icon: Users }] as const;

const OWNER_LINKS = [
	{ to: "/owner", label: "Nadzorna plošča", icon: Home, end: true },
	{ to: "/owner/requests", label: "Zahteve", icon: ClipboardList },
	{ to: "/owner/locations", label: "Lokacije", icon: MapPin },
] as const;

const LANDING_LINKS = [
	{ href: "#funkcionalnosti", label: "Funkcionalnosti" },
	{ href: "#cenik", label: "Cenik" },
	{ href: "#o-nas", label: "O nas" },
	{ href: "#kontakt", label: "Kontakt" },
] as const;

const RESITVE_LINKS = [
	{ href: "#resitve-hoteli", label: "Hoteli in nastanitve" },
	{ href: "#resitve-poslovni", label: "Poslovni objekti" },
	{ href: "#resitve-javni", label: "Javni sektor" },
] as const;

function AppNavLinks({
	links,
	pendingCount,
	onNavigate,
	className,
	variant = "default",
}: {
	links: readonly {
		to: string;
		label: string;
		icon: typeof Users;
		end?: boolean;
	}[];
	pendingCount?: number;
	onNavigate?: () => void;
	className?: string;
	variant?: "default" | "pill";
}) {
	return (
		<nav className={className}>
			{links.map((link) => (
				<NavLink
					key={link.to}
					to={link.to}
					end={link.end}
					onClick={onNavigate}
					className={({ isActive }) =>
						cn(
							variant === "pill"
								? "inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] transition-colors"
								: "flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium transition-colors",
							variant === "pill"
								? isActive
									? "text-foreground"
									: "text-muted-foreground hover:text-foreground"
								: isActive
									? "text-foreground"
									: "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
						)
					}
				>
					{() => (
						<>
							{variant === "default" ? <link.icon className="size-4" /> : null}
							{link.label}
							{link.to === "/owner/requests" &&
							pendingCount &&
							pendingCount > 0 ? (
								<span
									aria-label={`${pendingCount} pending requests`}
									className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm bg-foreground text-[11px] font-medium leading-none text-background"
								>
									{pendingCount > 9 ? "9+" : pendingCount}
								</span>
							) : null}
						</>
					)}
				</NavLink>
			))}
		</nav>
	);
}

function LandingNavLinks({ className }: { className?: string }) {
	return (
		<nav className={className} aria-label="Glavna navigacija">
			<a
				href="#funkcionalnosti"
				className="rounded-md px-3.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
			>
				Funkcionalnosti
			</a>

			<DropdownMenu>
				<DropdownMenuTrigger className="group inline-flex items-center gap-1 rounded-md px-3.5 py-2 text-sm font-medium text-foreground/80 transition-colors outline-none hover:text-foreground">
					Rešitve
					<ChevronDown className="size-3.5 transition-transform duration-200 group-data-popup-open:rotate-180" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="center" className="min-w-48">
					{RESITVE_LINKS.map((link) => (
						<DropdownMenuItem key={link.href} render={<a href={link.href} />}>
							{link.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			{LANDING_LINKS.slice(1).map((link) => (
				<a
					key={link.href}
					href={link.href}
					className="rounded-md px-3.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
				>
					{link.label}
				</a>
			))}
		</nav>
	);
}

function LandingActions({
	user,
	onNavigate,
	className,
}: {
	user?: NavbarUser | null;
	onNavigate?: () => void;
	className?: string;
}) {
	return (
		<div className={cn("flex items-center gap-3", className)}>
			{user ? (
				<Profile user={user} />
			) : (
				<Button
					variant="outline"
					className="inline-flex h-auto min-h-12 items-center justify-center rounded-md border-foreground bg-white px-8 py-3.5 text-sm font-medium leading-none text-foreground hover:bg-white hover:text-foreground"
					render={<Link to="/login" />}
					onClick={onNavigate}
				>
					Prijava
				</Button>
			)}
		</div>
	);
}

function LandingNavbar({
	user,
	menuOpen,
	setMenuOpen,
}: {
	user?: NavbarUser | null;
	menuOpen: boolean;
	setMenuOpen: (open: boolean) => void;
}) {
	return (
		<header className="border-b border-border/60 bg-white">
			<div className="relative flex w-full items-center gap-4 px-3 py-3.5 sm:px-4">
				<Link
					to="/"
					className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
				>
					<img
						src={logoWithText}
						alt="Servisnik"
						className="h-10 w-auto sm:h-11"
					/>
				</Link>

				<LandingNavLinks className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex" />

				<div className="ml-auto hidden sm:block">
					<LandingActions user={user} />
				</div>

				<Button
					type="button"
					variant="outline"
					size="icon"
					className="ml-auto rounded-full sm:hidden"
					aria-expanded={menuOpen}
					aria-label="Meni"
					onClick={() => setMenuOpen(!menuOpen)}
				>
					{menuOpen ? <X /> : <Menu />}
				</Button>
			</div>

			{menuOpen ? (
				<div className="border-t border-border/60 bg-white px-3 py-3 sm:px-4 sm:hidden">
					<nav className="flex flex-col gap-1" aria-label="Mobilna navigacija">
						<a
							href="#funkcionalnosti"
							className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted"
							onClick={() => setMenuOpen(false)}
						>
							Funkcionalnosti
						</a>
						<p className="px-3 pt-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
							Rešitve
						</p>
						{RESITVE_LINKS.map((link) => (
							<a
								key={link.href}
								href={link.href}
								className="rounded-lg px-3 py-2.5 pl-5 text-sm text-foreground/80 hover:bg-muted"
								onClick={() => setMenuOpen(false)}
							>
								{link.label}
							</a>
						))}
						{LANDING_LINKS.slice(1).map((link) => (
							<a
								key={link.href}
								href={link.href}
								className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted"
								onClick={() => setMenuOpen(false)}
							>
								{link.label}
							</a>
						))}
						<div className="mt-2 border-t border-border pt-3">
							<LandingActions
								user={user}
								onNavigate={() => setMenuOpen(false)}
								className="flex-col [&_button]:w-full"
							/>
						</div>
					</nav>
				</div>
			) : null}
		</header>
	);
}

function AppNavbar({
	user,
	pendingCount,
	isImpersonating,
	menuOpen,
	setMenuOpen,
}: {
	user: NavbarUser;
	pendingCount: number;
	isImpersonating: boolean;
	menuOpen: boolean;
	setMenuOpen: (open: boolean) => void;
}) {
	const links = user.role === "ADMIN" ? ADMIN_LINKS : OWNER_LINKS;

	return (
		<header className="border-b border-border/60 bg-white px-3 py-3 sm:px-4">
			<div className="w-full">
				<div className="flex items-center gap-4 sm:gap-8">
					<Link
						to="/"
						className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
					>
						<img
							src={logoWithText}
							alt="Servisnik"
							className="h-10 w-auto sm:h-11"
						/>
					</Link>

					<div className="ml-auto hidden items-center gap-2.5 md:flex">
						<AppNavLinks
							links={links}
							pendingCount={pendingCount}
							variant="pill"
							className="flex items-center gap-1.5"
						/>
						{!isImpersonating ? <Profile user={user} /> : null}
					</div>

					<div className="ml-auto flex items-center gap-3 md:hidden">
						{!isImpersonating ? <Profile user={user} /> : null}
						<Button
							type="button"
							variant="outline"
							size="icon"
							className="rounded-full"
							aria-expanded={menuOpen}
							aria-label="Meni"
							onClick={() => setMenuOpen(!menuOpen)}
						>
							{menuOpen ? <X /> : <Menu />}
						</Button>
					</div>
				</div>

				{menuOpen ? (
					<div className="mt-3 flex justify-end md:hidden">
						<div className="w-full max-w-xs rounded-md border border-border bg-white p-2.5">
							<AppNavLinks
								links={links}
								pendingCount={pendingCount}
								onNavigate={() => setMenuOpen(false)}
								className="flex flex-col gap-1"
							/>
						</div>
					</div>
				) : null}
			</div>
		</header>
	);
}

export function Navbar({
	variant = "app",
	user = null,
	pendingCount = 0,
	isImpersonating = false,
	impersonatorName = null,
}: NavbarProps) {
	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		if (!menuOpen) {
			return;
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setMenuOpen(false);
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [menuOpen]);

	return (
		<>
			{isImpersonating && user ? (
				<ImpersonationBanner
					userName={user.name}
					impersonatorName={impersonatorName}
				/>
			) : null}

			{variant === "landing" ? (
				<LandingNavbar
					user={user}
					menuOpen={menuOpen}
					setMenuOpen={setMenuOpen}
				/>
			) : user ? (
				<AppNavbar
					user={user}
					pendingCount={pendingCount}
					isImpersonating={isImpersonating}
					menuOpen={menuOpen}
					setMenuOpen={setMenuOpen}
				/>
			) : null}
		</>
	);
}

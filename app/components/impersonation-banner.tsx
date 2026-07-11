import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";

import { authClient } from "@/auth/auth.client";
import { Button } from "@/components/ui/button";

type ImpersonationBannerProps = {
	userName: string;
	impersonatorName: string | null;
};

export function ImpersonationBanner({
	userName,
	impersonatorName,
}: ImpersonationBannerProps) {
	const [isStopping, setIsStopping] = useState(false);

	async function stopImpersonating() {
		setIsStopping(true);

		try {
			await authClient.admin.stopImpersonating();
			window.location.href = "/admin";
		} catch {
			setIsStopping(false);
		}
	}

	return (
		<div className="flex items-center justify-between gap-3 border-b bg-muted/40 px-4 py-1.5 text-xs">
			<p className="min-w-0 truncate">
				<span className="font-medium text-foreground">Impersonation active</span>
				<span className="text-muted-foreground">
					{" — "}You are impersonating {userName}
					{impersonatorName ? ` (admin: ${impersonatorName})` : ""}.
				</span>
			</p>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="h-7 shrink-0 px-2 text-xs"
				disabled={isStopping}
				onClick={stopImpersonating}
			>
				{isStopping ? <Loader2 className="animate-spin" /> : <LogOut />}
				Exit impersonation
			</Button>
		</div>
	);
}

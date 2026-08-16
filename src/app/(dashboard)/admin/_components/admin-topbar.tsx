"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { TopbarShell, TopbarLeft, TopbarRight } from "@/components/layout/topbar-shell";
import { Badge } from "@/components/ui/badge";
import { RealtimeStatus } from "@/components/layout/realtime-status";

const BREADCRUMBS: Record<string, string> = {
  "/admin": "Command Center",
  "/admin/users": "All Users",
  "/admin/kyc": "KYC Queue",
  "/admin/loads": "All Loads",
  "/admin/disputes": "Disputes",
  "/admin/settlements": "Settlements",
  "/admin/analytics": "Analytics",
  "/admin/settings": "Settings",
};

export function AdminTopbar() {
  const pathname = usePathname();
  const title = BREADCRUMBS[pathname] ?? "Admin";

  return (
    <TopbarShell>
      <TopbarLeft>
      <RealtimeStatus />
        <Badge
          variant="outline"
          className="text-[10px] h-5 px-2 bg-amber-500/10 text-amber-600 border-amber-500/20"
        >
          ADMIN
        </Badge>
        <div className="h-4 w-px bg-[var(--border)]" />
        <h2 className="text-sm font-medium">{title}</h2>
      </TopbarLeft>
      <TopbarRight>
        <NotificationBell />
        <ThemeToggle />
      </TopbarRight>
    </TopbarShell>
  );
}
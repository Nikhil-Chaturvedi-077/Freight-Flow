"use client";

import { usePathname } from "next/navigation";
import { PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import {
  TopbarShell, TopbarLeft, TopbarRight,
} from "@/components/layout/topbar-shell";
import Link from "next/link";
import { Route } from "next";
import { RealtimeStatus } from "@/components/layout/realtime-status";

// Map pathnames to breadcrumb titles
const BREADCRUMBS: Record<string, string> = {
  "/shipper": "Dashboard",
  "/shipper/loads": "My Loads",
  "/shipper/loads/new": "Post New Load",
  "/shipper/bids": "Bid Monitor",
  "/shipper/wallet": "Escrow Wallet",
  "/shipper/invoices": "GST Invoices",
  "/shipper/settings": "Settings",
};

export function ShipperTopbar() {
  const pathname = usePathname();
  const title = BREADCRUMBS[pathname] ?? "Shipper";
  const showPostLoad = pathname !== "/shipper/loads/new";

  return (
    <TopbarShell>
      <TopbarLeft>
      <RealtimeStatus />
        {/* Live ping */}
        <div className="flex items-center gap-1.5">
          <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-[var(--muted-foreground)] hidden sm:block">
            Live
          </span>
        </div>
        <div className="h-4 w-px bg-[var(--border)]" />
        <h2 className="text-sm font-medium">{title}</h2>
      </TopbarLeft>

      <TopbarRight>
        {showPostLoad && (
          <Button size="sm" className="gap-1.5 h-7 text-xs hidden sm:flex" nativeButton={false} render={<Link href={"/shipper/loads/new" as Route}/>}>
              <PackagePlus className="size-3.5" />
              Post Load
          </Button>
        )}
        <NotificationBell />
        <ThemeToggle />
      </TopbarRight>
    </TopbarShell>
  );
}
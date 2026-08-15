"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { TopbarShell, TopbarLeft, TopbarRight } from "@/components/layout/topbar-shell";
import Link from "next/link";
import { Route } from "next";

const BREADCRUMBS: Record<string, string> = {
  "/transporter": "Dashboard",
  "/transporter/loads": "Find Loads",
  "/transporter/bids": "My Bids",
  "/transporter/won": "Won Loads",
  "/transporter/wallet": "My Wallet",
  "/transporter/kyc": "KYC & Documents",
  "/transporter/ratings": "My Ratings",
  "/transporter/settings": "Settings",
};

export function TransporterTopbar() {
  const pathname = usePathname();
  const title = BREADCRUMBS[pathname] ?? "Transporter";

  return (
    <TopbarShell>
      <TopbarLeft>
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
        <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs hidden sm:flex" render={<Link href={"/transporter/loads" as Route}/>}>
            <Search className="size-3.5" />
            Find Loads
        </Button>
        <NotificationBell />
        <ThemeToggle />
      </TopbarRight>
    </TopbarShell>
  );
}
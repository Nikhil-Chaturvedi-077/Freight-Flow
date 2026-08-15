"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Search, Gavel, CheckSquare,
  Wallet, FileCheck, Star, Settings, Truck,
} from "lucide-react";
import {
  Sidebar, SidebarHeader, SidebarContent, SidebarFooter,
  SidebarSection, SidebarNavItem, SidebarCollapseBtn,
  useSidebar,
} from "@/components/layout/sidebar-shell";
import { UserMenu } from "@/components/layout/user-menu";
import { AnimatePresence, motion } from "framer-motion";
import type { Session } from "next-auth";
import { Route } from "next";

const NAV = [
  {
    section: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/transporter" },
    ],
  },
  {
    section: "Loads",
    items: [
      { icon: Search, label: "Find Loads", href: "/transporter/loads" },
      { icon: Gavel, label: "My Bids", href: "/transporter/bids" },
      { icon: CheckSquare, label: "Won Loads", href: "/transporter/won" },
    ],
  },
  {
    section: "Finance & Docs",
    items: [
      { icon: Wallet, label: "My Wallet", href: "/transporter/wallet" },
      { icon: FileCheck, label: "KYC & Docs", href: "/transporter/kyc" },
      { icon: Star, label: "My Ratings", href: "/transporter/ratings" },
    ],
  },
  {
    section: "Account",
    items: [
      { icon: Settings, label: "Settings", href: "/transporter/settings" },
    ],
  },
];

interface TransporterSidebarProps {
  session: Session;
  activeBidCount?: number;
}

export function TransporterSidebar({
  session,
  activeBidCount,
}: TransporterSidebarProps) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href={"/transporter" as Route} className="flex items-center gap-2.5 min-w-0">
          <div className="size-7 rounded-md bg-emerald-600 flex items-center justify-center shrink-0">
            <Truck className="size-4 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-semibold text-sm tracking-tight truncate"
              >
                Freight-Flow
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <SidebarCollapseBtn />
      </SidebarHeader>

      <SidebarContent>
        {NAV.map((group) => (
          <div key={group.section}>
            <SidebarSection label={group.section} />
            {group.items.map((item) => (
              <SidebarNavItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                isActive={
                  item.href === "/transporter"
                    ? pathname === "/transporter"
                    : pathname.startsWith(item.href)
                }
                badge={
                  item.label === "My Bids" && activeBidCount
                    ? activeBidCount
                    : undefined
                }
              />
            ))}
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <UserMenu
          name={session.user.name ?? "Transporter"}
          email={session.user.email ?? ""}
          image={session.user.image}
          role="TRANSPORTER"
          companyName={session.user.companyName}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, PackagePlus, List, Gavel,
  Wallet, FileText, Truck, Settings,
} from "lucide-react";
import {
  Sidebar, SidebarHeader, SidebarContent, SidebarFooter,
  SidebarSection, SidebarNavItem, SidebarCollapseBtn,
  useSidebar,
} from "@/components/layout/sidebar-shell";
import { UserMenu } from "@/components/layout/user-menu";
import { AnimatePresence, motion } from "framer-motion";
import type { Session } from "next-auth";

const NAV = [
  {
    section: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/shipper" },
    ],
  },
  {
    section: "Load Management",
    items: [
      { icon: PackagePlus, label: "Post Load", href: "/shipper/loads/new" },
      { icon: List, label: "My Loads", href: "/shipper/loads" },
      { icon: Gavel, label: "Bid Monitor", href: "/shipper/bids" },
    ],
  },
  {
    section: "Finance",
    items: [
      { icon: Wallet, label: "Escrow Wallet", href: "/shipper/wallet" },
      { icon: FileText, label: "GST Invoices", href: "/shipper/invoices" },
    ],
  },
  {
    section: "Account",
    items: [
      { icon: Settings, label: "Settings", href: "/shipper/settings" },
    ],
  },
];

interface ShipperSidebarProps {
  session: Session;
  liveBidCount?: number;
}

export function ShipperSidebar({ session, liveBidCount }: ShipperSidebarProps) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  return (
    <Sidebar>
      {/* Logo */}
      <SidebarHeader>
        <Link href={"/shipper" as Route} className="flex items-center gap-2.5 min-w-0">
          <div className="size-7 rounded-md bg-[var(--primary)] flex items-center justify-center shrink-0">
            <Truck className="size-4 text-[var(--primary-foreground)]" />
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

      {/* Nav */}
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
                  item.href === "/shipper"
                    ? pathname === "/shipper"
                    : pathname.startsWith(item.href)
                }
                badge={
                  item.label === "Bid Monitor" && liveBidCount
                    ? liveBidCount
                    : undefined
                }
              />
            ))}
          </div>
        ))}
      </SidebarContent>

      {/* User */}
      <SidebarFooter>
        <UserMenu
          name={session.user.name ?? "Shipper"}
          email={session.user.email ?? ""}
          image={session.user.image}
          role="SHIPPER"
          companyName={session.user.companyName}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
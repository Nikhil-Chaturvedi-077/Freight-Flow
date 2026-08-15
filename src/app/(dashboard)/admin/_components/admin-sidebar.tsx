"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, ShieldCheck, BarChart3,
  Landmark, AlertTriangle, Settings, Truck, FileSearch,
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
      { icon: LayoutDashboard, label: "Command Center", href: "/admin" },
    ],
  },
  {
    section: "User Management",
    items: [
      { icon: Users, label: "All Users", href: "/admin/users" },
      { icon: ShieldCheck, label: "KYC Queue", href: "/admin/kyc" },
    ],
  },
  {
    section: "Operations",
    items: [
      { icon: FileSearch, label: "All Loads", href: "/admin/loads" },
      { icon: AlertTriangle, label: "Disputes", href: "/admin/disputes" },
    ],
  },
  {
    section: "Finance",
    items: [
      { icon: Landmark, label: "Settlements", href: "/admin/settlements" },
      { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
    ],
  },
  {
    section: "System",
    items: [
      { icon: Settings, label: "Settings", href: "/admin/settings" },
    ],
  },
];

interface AdminSidebarProps {
  session: Session;
  kycPendingCount?: number;
  disputeCount?: number;
}

export function AdminSidebar({
  session,
  kycPendingCount,
  disputeCount,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href={"/admin" as Route} className="flex items-center gap-2.5 min-w-0">
          <div className="size-7 rounded-md bg-amber-600 flex items-center justify-center shrink-0">
            <Truck className="size-4 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0"
              >
                <p className="font-semibold text-sm tracking-tight truncate leading-none">
                  Freight-Flow
                </p>
                <p className="text-[10px] text-amber-500 font-medium mt-0.5">
                  Admin Console
                </p>
              </motion.div>
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
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href)
                }
                badge={
                  item.label === "KYC Queue"
                    ? kycPendingCount
                    : item.label === "Disputes"
                      ? disputeCount
                      : undefined
                }
              />
            ))}
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <UserMenu
          name={session.user.name ?? "Admin"}
          email={session.user.email ?? ""}
          image={session.user.image}
          role="ADMIN"
        />
      </SidebarFooter>
    </Sidebar>
  );
}
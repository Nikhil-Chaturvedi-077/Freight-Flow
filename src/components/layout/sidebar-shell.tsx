"use client";

import { useState, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Context ──────────────────────────────────────────────
type SidebarCtx = { collapsed: boolean; toggle: () => void };
const SidebarContext = createContext<SidebarCtx>({
  collapsed: false,
  toggle: () => {},
});
export const useSidebar = () => useContext(SidebarContext);

// ── Root Shell ───────────────────────────────────────────
export function SidebarShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarContext.Provider
      value={{ collapsed, toggle: () => setCollapsed((v) => !v) }}
    >
      <div className="flex h-screen overflow-hidden bg-[var(--background)]">
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

// ── Sidebar Container ────────────────────────────────────
export function Sidebar({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 220 }}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      className={cn(
        "relative flex flex-col h-full shrink-0 overflow-hidden",
        "bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]"
      )}
    >
      {children}
    </motion.aside>
  );
}

// ── Sidebar Header ───────────────────────────────────────
export function SidebarHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-14 flex items-center px-3 border-b border-[var(--sidebar-border)] shrink-0">
      {children}
    </div>
  );
}

// ── Sidebar Content ──────────────────────────────────────
export function SidebarContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5 px-2">
      {children}
    </div>
  );
}

// ── Sidebar Footer ───────────────────────────────────────
export function SidebarFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="shrink-0 border-t border-[var(--sidebar-border)] p-2">
      {children}
    </div>
  );
}

// ── Sidebar Section Label ─────────────────────────────────
export function SidebarSection({ label }: { label: string }) {
  const { collapsed } = useSidebar();
  return (
    <AnimatePresence>
      {!collapsed && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="px-2 pt-4 pb-1 text-[10px] uppercase tracking-widest font-medium text-[var(--muted-foreground)]"
        >
          {label}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

// ── Sidebar Nav Item ─────────────────────────────────────
interface NavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive?: boolean;
  badge?: number;
  onClick?: () => void;
}

export function SidebarNavItem({
  icon: Icon,
  label,
  href,
  isActive,
  badge,
  onClick,
}: NavItemProps) {
  const { collapsed } = useSidebar();

  const content = (
    <Link
      href={href as Route}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-all duration-150 group relative",
        "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
        isActive
          ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
          : "text-[var(--muted-foreground)]"
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="active-nav"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[var(--primary)] rounded-r-full"
        />
      )}

      <Icon
        className={cn(
          "shrink-0 size-4",
          isActive
            ? "text-[var(--primary)]"
            : "text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]"
        )}
      />

      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="flex-1 truncate"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="ml-auto shrink-0 text-[10px] font-medium bg-[var(--primary)]/15 text-[var(--primary)] rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <TooltipProvider delay={0}>
        <Tooltip>
          <TooltipTrigger render={content}>
            <span className="sr-only">{label}</span>
          </TooltipTrigger>
  
          <TooltipContent side="right" className="text-xs">
            {label}
            {badge !== undefined && badge > 0 && ` (${badge})`}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

// ── Collapse Toggle Button ───────────────────────────────
export function SidebarCollapseBtn() {
  const { collapsed, toggle } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="size-7 ml-auto text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
    >
      {collapsed ? (
        <PanelLeftOpen className="size-4" />
      ) : (
        <PanelLeftClose className="size-4" />
      )}
    </Button>
  );
}
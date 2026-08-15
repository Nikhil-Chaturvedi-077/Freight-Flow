"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

// In production this comes from a server action / websocket
const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    title: "New bid received",
    body: "Rajput Logistics bid ₹38,500 on FF-2847",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 4),
    type: "bid" as const,
  },
  {
    id: "2",
    title: "Load delivered",
    body: "FF-2831 confirmed delivered. Escrow released.",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 22),
    type: "delivery" as const,
  },
  {
    id: "3",
    title: "KYC approved",
    body: "Your KYC documents have been verified.",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    type: "kyc" as const,
  },
];

const TYPE_COLORS = {
  bid: "bg-blue-500/10 text-blue-500",
  delivery: "bg-emerald-500/10 text-emerald-500",
  kyc: "bg-amber-500/10 text-amber-500",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative size-8"
          />
        }
      >
        <Bell className="size-4" />

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-semibold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <p className="text-sm font-medium">Notifications</p>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-[var(--primary)] hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="divide-y divide-[var(--border)] max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
              No notifications
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex gap-3 px-4 py-3 text-sm transition-colors hover:bg-[var(--muted)]",
                  !n.read && "bg-[var(--primary)]/[0.03]"
                )}
              >
                <div
                  className={cn(
                    "size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold",
                    TYPE_COLORS[n.type]
                  )}
                >
                  {n.type === "bid" ? "B" : n.type === "delivery" ? "D" : "K"}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-medium truncate",
                      !n.read
                        ? "text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)]"
                    )}
                  >
                    {n.title}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-2">
                    {n.body}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                    {formatRelativeTime(n.createdAt)}
                  </p>
                </div>
                {!n.read && (
                  <div className="size-1.5 rounded-full bg-[var(--primary)] shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
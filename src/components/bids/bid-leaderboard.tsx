"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Crown, TrendingDown, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatRelativeTime } from "@/lib/utils";
import { useLoadBids } from "@/hooks/use-load-bids";
import { acceptBid } from "@/actions/bid.actions";
import { toast } from "sonner";
import { useState, useTransition } from "react";
import type { LeaderboardEntry } from "@/types/socket";

interface BidLeaderboardProps {
  loadId: string;
  loadNumber: string;
  loadStatus: string;
  shipperId: string;
  currentUserId: string;
  userRole: string;
  initialLeaderboard: LeaderboardEntry[];
  initialTotalBids: number;
}

export function BidLeaderboard({
  loadId,
  loadNumber,
  loadStatus,
  shipperId,
  currentUserId,
  userRole,
  initialLeaderboard,
  initialTotalBids,
}: BidLeaderboardProps) {
  const { leaderboard, totalBids, isFlashing } = useLoadBids({
    loadId,
    initialLeaderboard,
    initialTotalBids,
    initialLowestBid: initialLeaderboard[0]?.amount ?? 0,
  });

  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isShipper = userRole === "SHIPPER" && shipperId === currentUserId;
  const canAccept = isShipper && loadStatus === "OPEN";

  function handleAccept(bidId: string) {
    setAcceptingId(bidId);
    startTransition(async () => {
      const result = await acceptBid(loadId, bidId);
      if (!result.success) {
        toast.error(result.error);
        setAcceptingId(null);
        return;
      }
      toast.success("Bid accepted! Load is now assigned.");
      setAcceptingId(null);
    });
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-[var(--card)] overflow-hidden",
        "transition-all duration-300",
        isFlashing && "border-[var(--primary)] shadow-sm shadow-[var(--primary)]/20"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <TrendingDown className="size-4 text-[var(--primary)]" />
          <h3 className="text-sm font-semibold">Live Bid Leaderboard</h3>
          {isFlashing && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="size-1.5 rounded-full bg-[var(--primary)] animate-pulse"
            />
          )}
        </div>
        <span className="text-xs text-[var(--muted-foreground)]">
          {totalBids} bid{totalBids !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Leaderboard */}
      <div className="divide-y divide-[var(--border)]">
        <AnimatePresence mode="popLayout">
          {leaderboard.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">
                No bids yet. Be the first!
              </p>
            </div>
          ) : (
            leaderboard.map((entry, index) => {
              const isLeading = entry.status === "LEADING";
              const isCurrentUser = entry.transporterId === currentUserId;

              return (
                <motion.div
                  key={entry.bidId}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3",
                    isLeading && "bg-emerald-500/5",
                    isCurrentUser && "bg-[var(--primary)]/5"
                  )}
                >
                  {/* Rank */}
                  <div
                    className={cn(
                      "size-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      index === 0
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                    )}
                  >
                    {index === 0 ? (
                      <Crown className="size-3.5" />
                    ) : (
                      entry.rank
                    )}
                  </div>

                  {/* Transporter info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">
                        {entry.companyName ?? entry.transporterName}
                      </p>
                      {isCurrentUser && (
                        <span className="text-[10px] bg-[var(--primary)]/10 text-[var(--primary)] px-1.5 py-0.5 rounded-full font-medium">
                          You
                        </span>
                      )}
                    </div>
                    {entry.rating > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="size-2.5 text-amber-400 fill-amber-400" />
                        <span className="text-[10px] text-[var(--muted-foreground)]">
                          {entry.rating.toFixed(1)} · {entry.totalTrips} trips
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        isLeading
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-[var(--foreground)]"
                      )}
                    >
                      {formatCurrency(entry.amount)}
                    </p>
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        isLeading
                          ? "text-emerald-600"
                          : "text-[var(--muted-foreground)]"
                      )}
                    >
                      {isLeading ? "Leading" : "Outbid"}
                    </span>
                  </div>

                  {/* Accept button (shipper only) */}
                  {canAccept && (
                    <Button
                      size="sm"
                      variant={isLeading ? "default" : "outline"}
                      className="h-7 text-xs shrink-0"
                      onClick={() => handleAccept(entry.bidId)}
                      disabled={isPending}
                    >
                      {acceptingId === entry.bidId ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        "Accept"
                      )}
                    </Button>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
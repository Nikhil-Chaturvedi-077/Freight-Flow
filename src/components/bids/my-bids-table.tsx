"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, Clock, MoreHorizontal,
  TrendingDown, Loader2, XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { BID_STATUS_CONFIG } from "@/lib/constants";
import {
  cn,
  formatCurrency,
  formatCountdown,
  formatRelative,
} from "@/lib/utils";
import { withdrawBid } from "@/actions/bid.actions";
import { toast } from "sonner";
import type { BidStatus, LoadStatus } from "@prisma/client";
import { Route } from "next";

interface Bid {
  id: string;
  amount: number;
  status: BidStatus;
  submittedAt: Date;
  updatedAt: Date;
  note: string | null;
  load: {
    id: string;
    loadNumber: string;
    pickupAddress: string;
    dropAddress: string;
    materialType: string;
    weight: number;
    status: LoadStatus;
    biddingClosesAt: Date;
    bids: { amount: number }[];
  };
}

export function MyBidsTable({ bids }: { bids: Bid[] }) {
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleWithdraw(bidId: string) {
    setWithdrawingId(bidId);
    startTransition(async () => {
      const result = await withdrawBid(bidId);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Bid withdrawn");
      }
      setWithdrawingId(null);
    });
  }

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 bg-[var(--muted)]/40 border-b border-[var(--border)]">
        {[
          { label: "Load", span: 2 },
          { label: "Route", span: 3 },
          { label: "Material", span: 2 },
          { label: "Your Bid", span: 2 },
          { label: "Status", span: 2 },
          { label: "", span: 1 },
        ].map((h) => (
          <div
            key={h.label}
            className={cn(
              "text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]",
              `col-span-${h.span}`
            )}
          >
            {h.label}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-[var(--border)]">
        {bids.map((bid, index) => {
          const cfg = BID_STATUS_CONFIG[bid.status];
          const lowestBid = bid.load.bids[0]?.amount ?? null;
          const isLeading =
            bid.status === "ACTIVE" &&
            lowestBid !== null &&
            bid.amount <= lowestBid;
          const isWithdrawing = withdrawingId === bid.id;
          const canWithdraw =
            bid.load.status === "OPEN" &&
            ["ACTIVE", "OUTBID"].includes(bid.status) &&
            new Date(bid.load.biddingClosesAt) > new Date();

          return (
            <motion.div
              key={bid.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.03 }}
              className={cn(
                "grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3.5",
                "hover:bg-[var(--muted)]/20 transition-colors",
                isWithdrawing && "opacity-50"
              )}
            >
              {/* Load */}
              <div className="md:col-span-2">
                <Link
                  href={`/transporter/loads/${bid.load.id}` as Route}
                  className="font-mono text-xs font-semibold text-[var(--primary)] hover:underline"
                >
                  {bid.load.loadNumber}
                </Link>
                <div className="mt-1">
                  <LoadStatusBadge status={bid.load.status} />
                </div>
              </div>

              {/* Route */}
              <div className="md:col-span-3">
                <p className="text-xs font-medium truncate">
                  {bid.load.pickupAddress.split(",")[0]}
                </p>
                <div className="flex items-center gap-1 my-0.5">
                  <div className="h-px w-4 bg-[var(--border)]" />
                  <ArrowRight className="size-2.5 text-[var(--muted-foreground)]" />
                </div>
                <p className="text-xs font-medium truncate">
                  {bid.load.dropAddress.split(",")[0]}
                </p>
              </div>

              {/* Material */}
              <div className="md:col-span-2">
                <p className="text-xs font-medium capitalize">
                  {bid.load.materialType.toLowerCase()}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                  {bid.load.weight} MT
                </p>
              </div>

              {/* Your bid */}
              <div className="md:col-span-2">
                <p className="text-sm font-semibold">
                  {formatCurrency(bid.amount)}
                </p>
                {lowestBid && bid.status !== "ACCEPTED" && (
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                    {isLeading ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Leading bid
                      </span>
                    ) : (
                      <>Best: {formatCurrency(lowestBid)}</>
                    )}
                  </p>
                )}
                {bid.load.status === "OPEN" && (
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-[var(--muted-foreground)]">
                    <Clock className="size-2.5" />
                    {formatCountdown(bid.load.biddingClosesAt)}
                  </div>
                )}
              </div>

              {/* Bid status */}
              <div className="md:col-span-2 flex items-center">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5",
                    "text-[10px] font-medium",
                    isLeading
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : cfg.color
                  )}
                >
                  {isLeading ? "Leading" : cfg.label}
                </span>
              </div>

              {/* Actions */}
              <div className="md:col-span-1 flex items-center justify-end">
                <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={isWithdrawing}
                  >
                    {isWithdrawing ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <MoreHorizontal className="size-3.5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem render={<Link
                        href={`/transporter/loads/${bid.load.id}` as Route}
                        className="gap-2 text-xs"
                      />}>
                        <TrendingDown className="size-3.5" />
                        View load
                    </DropdownMenuItem>
                    {canWithdraw && (
                      <DropdownMenuItem
                        className="gap-2 text-xs text-destructive focus:text-destructive"
                        onClick={() => handleWithdraw(bid.id)}
                      >
                        <XCircle className="size-3.5" />
                        Withdraw bid
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Clock, Package,
  TrendingDown, CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../../components/shared/empty-state";
import { cn, formatCurrency, formatCountdown, formatRelative } from "@/lib/utils";
import { useLoadboard } from "@/hooks/use-loadboard";
import { useState } from "react";
import { toast } from "sonner";
import type { NewLoadPostedPayload } from "@/types/socket";

interface Load {
  id: string;
  loadNumber: string;
  pickupAddress: string;
  dropAddress: string;
  materialType: string;
  packagingType: string;
  weight: number;
  biddingClosesAt: Date;
  basePrice: number | null;
  isFragile: boolean;
  isTarpRequired: boolean;
  labourRequired: boolean;
  createdAt: Date;
  lowestBid: number | null;
  shipper: {
    name: string | null;
    companyName: string | null;
  };
  _count: { bids: number };
  bids: { id: string; amount: number; status: string }[];
}

interface LoadBoardTableProps {
  loads: Load[];
  transporterId: string;
}

export function LoadBoardTable({
  loads: initialLoads,
  transporterId,
}: LoadBoardTableProps) {
  const [newLoadBanner, setNewLoadBanner] = useState<NewLoadPostedPayload | null>(null);

  // Real-time new load notifications
  useLoadboard((newLoad) => {
    setNewLoadBanner(newLoad);
    toast(`New load: ${newLoad.loadNumber}`, {
      description: `${newLoad.pickupAddress.split(",")[0]} → ${newLoad.dropAddress.split(",")[0]}`,
      action: {
        label: "View",
        onClick: () => {
          window.location.href = `/transporter/loads/${newLoad.loadId}`;
        },
      },
    });
  });

  if (initialLoads.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No loads available"
        description="No open loads match your filters. Try adjusting your search."
      />
    );
  }

  return (
    <div className="space-y-2">
      {/* New load banner */}
      {newLoadBanner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-lg border border-[var(--primary)]/40 bg-[var(--primary)]/5 px-4 py-2.5"
        >
          <div className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
            <p className="text-sm font-medium">
              New load posted: {newLoadBanner.loadNumber}
            </p>
          </div>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </motion.div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 bg-[var(--muted)]/40 border-b border-[var(--border)]">
          {["Load ID", "Route", "Material / Weight", "Best Bid", "Closes In", ""].map(
            (h, i) => (
              <div
                key={h}
                className={cn(
                  "text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]",
                  i === 0 && "col-span-2",
                  i === 1 && "col-span-3",
                  i === 2 && "col-span-2",
                  i === 3 && "col-span-2",
                  i === 4 && "col-span-2",
                  i === 5 && "col-span-1"
                )}
              >
                {h}
              </div>
            )
          )}
        </div>

        {/* Rows */}
        <div className="divide-y divide-[var(--border)]">
          {initialLoads.map((load, index) => {
            const myBid = load.bids[0];
            const isLeading =
              myBid &&
              load.lowestBid !== null &&
              myBid.amount <= load.lowestBid;
            const countdown = formatCountdown(load.biddingClosesAt);
            const isUrgent =
              new Date(load.biddingClosesAt).getTime() - Date.now() 
              2 * 60 * 60 * 1000; // < 2 hours

            return (
              <motion.div
                key={load.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4",
                  "px-4 py-3.5 hover:bg-[var(--muted)]/30",
                  "transition-colors group cursor-pointer"
                )}
                onClick={() =>
                  (window.location.href = `/transporter/loads/${load.id}`)
                }
              >
                {/* Load ID */}
                <div className="md:col-span-2 flex items-center gap-2">
                  <div>
                    <p className="font-mono text-xs font-semibold text-[var(--primary)]">
                      {load.loadNumber}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                      {load.shipper.companyName ?? load.shipper.name}
                    </p>
                  </div>
                </div>

                {/* Route */}
                <div className="md:col-span-3">
                  <p className="text-xs font-medium">
                    {load.pickupAddress.split(",")[0]}
                  </p>
                  <div className="flex items-center gap-1 my-0.5">
                    <div className="h-px flex-1 bg-[var(--border)]" />
                    <ArrowRight className="size-2.5 text-[var(--muted-foreground)]" />
                  </div>
                  <p className="text-xs font-medium">
                    {load.dropAddress.split(",")[0]}
                  </p>
                </div>

                {/* Material + Weight */}
                <div className="md:col-span-2">
                  <p className="text-xs font-medium capitalize">
                    {load.materialType.toLowerCase()}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                    {load.weight} MT · {load.packagingType.toLowerCase()}
                  </p>
                  {/* Flags */}
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {load.isFragile && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-600">
                        Fragile
                      </span>
                    )}
                    {load.isTarpRequired && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/10 text-blue-600">
                        Tarp
                      </span>
                    )}
                    {load.labourRequired && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-purple-500/10 text-purple-600">
                        Labour
                      </span>
                    )}
                  </div>
                </div>

                {/* Best bid */}
                <div className="md:col-span-2">
                  {load.lowestBid ? (
                    <div>
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(load.lowestBid)}
                      </p>
                      <p className="text-[10px] text-[var(--muted-foreground)]">
                        {load._count.bids} bid
                        {load._count.bids !== 1 ? "s" : ""}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        No bids yet
                      </p>
                      {load.basePrice && (
                        <p className="text-[10px] text-[var(--muted-foreground)]">
                          Base: {formatCurrency(load.basePrice)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* My bid status */}
                  {myBid && (
                    <div
                      className={cn(
                        "inline-flex items-center gap-1 mt-1",
                        "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                        isLeading
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600"
                      )}
                    >
                      {isLeading ? (
                        <CheckCircle2 className="size-2.5" />
                      ) : (
                        <TrendingDown className="size-2.5" />
                      )}
                      {isLeading ? "Leading" : "Outbid"}
                    </div>
                  )}
                </div>

                {/* Closes in */}
                <div className="md:col-span-2 flex items-center">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 text-xs",
                      isUrgent
                        ? "text-red-500 font-medium"
                        : "text-[var(--muted-foreground)]"
                    )}
                  >
                    <Clock
                      className={cn(
                        "size-3",
                        isUrgent && "animate-pulse"
                      )}
                    />
                    {countdown}
                  </div>
                </div>

                {/* CTA */}
                <div className="md:col-span-1 flex items-center justify-end">
                  <Button
                    size="sm"
                    variant={myBid ? "outline" : "default"}
                    className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/transporter/loads/${load.id}`;
                    }}
                  >
                    {myBid ? "Update" : "Bid"}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
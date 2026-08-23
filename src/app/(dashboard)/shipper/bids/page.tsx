import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Gavel, ArrowRight, Crown, Clock, AlertCircle } from "lucide-react";
import { cn, formatCurrency, formatCountdown } from "@/lib/utils";
import { acceptBid } from "@/actions/bid.actions";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bid Monitor" };
export const experimental_ppr = true;

// ── Bid Monitor List ───────────────────────────────────────
async function BidMonitorList({ shipperId }: { shipperId: string }) {
  // ✅ No biddingClosesAt filter — show all OPEN loads with bids
  // Shipper needs to see bids even after window closes to accept them
  const loads = await prisma.load.findMany({
    where: {
      shipperId,
      status: "OPEN", // only OPEN loads (not yet accepted/cancelled)
    },
    orderBy: { biddingClosesAt: "asc" },
    include: {
      _count: { select: { bids: true } },
      bids: {
        where: {
          status: { in: ["ACTIVE", "OUTBID"] },
        },
        orderBy: { amount: "asc" },
        take: 5,
        include: {
          transporter: {
            select: {
              id: true,
              name: true,
              companyName: true,
              transporterProfile: {
                select: { rating: true, totalTrips: true },
              },
            },
          },
        },
      },
    },
  });

  // Filter only loads that actually have bids
  const loadsWithBids = loads.filter((l) => l.bids.length > 0);

  if (loadsWithBids.length === 0) {
    return (
      <EmptyState
        icon={Gavel}
        title="No active bidding"
        description="No bids received on your open loads yet. Share your load to get more bids."
      >
        <Button size="sm" nativeButton={false} render={<Link href="/shipper/loads/new"/>}>
          Post a Load
        </Button>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      {loadsWithBids.map((load) => {
        const now = new Date();
        const isBiddingOpen = new Date(load.biddingClosesAt) > now;
        const countdown = formatCountdown(load.biddingClosesAt);
        const isUrgent =
          isBiddingOpen &&
          new Date(load.biddingClosesAt).getTime() - now.getTime() 
            2 * 60 * 60 * 1000;

        return (
          <div
            key={load.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
          >
            {/* Load header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/20 flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href={`/shipper/loads/${load.id}`}
                  className="font-mono text-sm font-semibold text-[var(--primary)] hover:underline"
                >
                  {load.loadNumber}
                </Link>
                <span className="text-xs text-[var(--muted-foreground)] hidden sm:block">
                  {load.pickupAddress.split(",")[0]} →{" "}
                  {load.dropAddress.split(",")[0]}
                </span>
                <LoadStatusBadge status={load.status} />
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Bidding window status */}
                {isBiddingOpen ? (
                  <span
                    className={cn(
                      "flex items-center gap-1.5 text-xs",
                      isUrgent
                        ? "text-red-500 font-semibold"
                        : "text-[var(--muted-foreground)]"
                    )}
                  >
                    <Clock
                      className={cn("size-3", isUrgent && "animate-pulse")}
                    />
                    {countdown}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                    <AlertCircle className="size-3" />
                    Window closed — accept a bid
                  </span>
                )}

                <span className="text-xs text-[var(--muted-foreground)]">
                  {load._count.bids} bid{load._count.bids !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Bids list */}
            <div className="divide-y divide-[var(--border)]">
              {load.bids.map((bid, index) => {
                const isLeader = index === 0;

                return (
                  <div
                    key={bid.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3",
                      isLeader && "bg-emerald-500/[0.03]"
                    )}
                  >
                    {/* Rank */}
                    <div
                      className={cn(
                        "size-7 rounded-full flex items-center justify-center",
                        "text-xs font-bold shrink-0",
                        isLeader
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                      )}
                    >
                      {isLeader ? (
                        <Crown className="size-3.5" />
                      ) : (
                        index + 1
                      )}
                    </div>

                    {/* Transporter info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {bid.transporter.companyName ??
                          bid.transporter.name}
                      </p>
                      {bid.transporter.transporterProfile && (
                        <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                          ⭐{" "}
                          {bid.transporter.transporterProfile.rating.toFixed(1)}
                          {" · "}
                          {bid.transporter.transporterProfile.totalTrips} trips
                        </p>
                      )}
                    </div>

                    {/* Bid amount */}
                    <p
                      className={cn(
                        "text-sm font-semibold shrink-0",
                        isLeader
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-[var(--foreground)]"
                      )}
                    >
                      {formatCurrency(bid.amount)}
                    </p>

                    {/* Accept button — Server Action */}
                    <form
                      action={async () => {
                        "use server";
                        await acceptBid(load.id, bid.id);
                      }}
                    >
                      <Button
                        type="submit"
                        size="sm"
                        variant={isLeader ? "default" : "outline"}
                        className="h-7 text-xs shrink-0"
                      >
                        Accept
                      </Button>
                    </form>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--muted)]/10 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1 text-[var(--muted-foreground)]"
                render={<Link href={`/shipper/loads/${load.id}`}/>}
                nativeButton={false}
              >
                  View full load
                  <ArrowRight className="size-3" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────
function BidMonitorSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--border)] overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/20">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-40 hidden sm:block" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
          {Array.from({ length: 3 }).map((_, j) => (
            <div
              key={j}
              className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] last:border-0"
            >
              <Skeleton className="size-7 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="h-4 w-16 shrink-0" />
              <Skeleton className="h-7 w-16 rounded-lg shrink-0" />
            </div>
          ))}
          <div className="px-4 py-2 border-t border-[var(--border)]">
            <Skeleton className="h-4 w-24 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────
export default async function BidMonitorPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // ✅ Count — matches list query exactly
  const activeBidCount = await prisma.bid.count({
    where: {
      load: {
        shipperId: session.user.id,
        status: "OPEN",
      },
      status: { in: ["ACTIVE", "OUTBID"] },
    },
  });

  return (
    <div className="space-y-5 max-w-screen-lg">
      <PageHeader
        title="Bid Monitor"
        description={
          activeBidCount > 0
            ? `${activeBidCount} active bid${activeBidCount !== 1 ? "s" : ""} across your open loads`
            : "No bids received on your open loads yet"
        }
        icon={Gavel}
      />

      <Suspense fallback={<BidMonitorSkeleton />}>
        <BidMonitorList shipperId={session.user.id} />
      </Suspense>
    </div>
  );
}
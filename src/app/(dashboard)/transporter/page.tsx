import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import {
  Gavel, Wallet, Star, CheckCircle,
  TrendingUp, ArrowRight,
} from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { BID_STATUS_CONFIG } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Route } from "next";

export const experimental_ppr = true;

async function getTransporterMetrics(transporterId: string) {
  const startOfMonth = new Date(
    new Date().getFullYear(), new Date().getMonth(), 1
  );

  const [activeBids, wonLoads, walletData, profile] = await Promise.all([
    prisma.bid.count({
      where: { transporterId, status: "ACTIVE" },
    }),
    prisma.load.count({
      where: {
        acceptedBid: { transporterId },
        status: { in: ["IN_TRANSIT", "ARRIVED", "DELIVERED"] },
      },
    }),
    prisma.wallet.findUnique({
      where: { userId: transporterId },
      select: { balance: true, totalEarned: true },
    }),
    prisma.transporterProfile.findUnique({
      where: { userId: transporterId },
      select: { rating: true, totalTrips: true },
    }),
  ]);

  return {
    activeBids,
    wonLoads,
    walletBalance: walletData?.balance ?? 0,
    totalEarned: walletData?.totalEarned ?? 0,
    rating: profile?.rating ?? 0,
    totalTrips: profile?.totalTrips ?? 0,
  };
}

async function getActiveBids(transporterId: string) {
  return prisma.bid.findMany({
    where: {
      transporterId,
      status: { in: ["ACTIVE", "OUTBID"] },
    },
    orderBy: { submittedAt: "desc" },
    take: 5,
    include: {
      load: {
        select: {
          id: true,
          loadNumber: true,
          pickupAddress: true,
          dropAddress: true,
          materialType: true,
          weight: true,
          status: true,
          biddingClosesAt: true,
          bids: {
            where: { status: "ACTIVE" },
            orderBy: { amount: "asc" },
            take: 1,
            select: { amount: true },
          },
        },
      },
    },
  });
}

async function getOpenLoadsNearby(transporterId: string) {
  // In production, filter by geo proximity
  return prisma.load.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: {
      _count: { select: { bids: true } },
      bids: {
        orderBy: { amount: "asc" },
        take: 1,
        select: { amount: true },
      },
    },
  });
}

// ── Metrics ───────────────────────────────────────────────
async function TransporterMetrics({ transporterId }: { transporterId: string }) {
  const m = await getTransporterMetrics(transporterId);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard
        label="Active Bids"
        value={m.activeBids}
        sub="Across open loads"
        icon={Gavel}
        iconColor="bg-purple-500/10 text-purple-500"
      />
      <MetricCard
        label="Wallet Balance"
        value={formatCurrency(m.walletBalance)}
        sub={`Total earned: ${formatCurrency(m.totalEarned)}`}
        icon={Wallet}
        iconColor="bg-emerald-500/10 text-emerald-500"
      />
      <MetricCard
        label="Loads Won"
        value={m.wonLoads}
        sub="All time"
        subVariant="up"
        icon={CheckCircle}
      />
      <MetricCard
        label="Rating"
        value={m.rating > 0 ? `${m.rating.toFixed(1)} ★` : "New"}
        sub={`${m.totalTrips} trips completed`}
        icon={Star}
        iconColor="bg-amber-500/10 text-amber-500"
      />
    </div>
  );
}

// ── Active Bids ───────────────────────────────────────────
async function ActiveBids({ transporterId }: { transporterId: string }) {
  const bids = await getActiveBids(transporterId);

  if (bids.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] border-dashed p-8 text-center">
        <Gavel className="size-7 text-[var(--muted-foreground)] mx-auto mb-2" />
        <p className="text-sm font-medium">No active bids</p>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          Find loads and start bidding
        </p>
        <Button size="sm" className="mt-3" nativeButton={false} render={<Link href={"/transporter/loads" as Route}/>}>
          Browse Loads
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
      {bids.map((bid) => {
        const lowestBid = bid.load.bids[0]?.amount;
        const isLeading = lowestBid === bid.amount;
        const config = BID_STATUS_CONFIG[bid.status];

        return (
          <Link
            key={bid.id}
            href={`/transporter/loads/${bid.load.id}` as Route}
            className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--muted)]/30 transition-colors group"
          >
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-medium text-[var(--primary)]">
                  {bid.load.loadNumber}
                </span>
                <LoadStatusBadge status={bid.load.status} />
              </div>
              <p className="text-xs text-[var(--muted-foreground)] truncate">
                {bid.load.pickupAddress.split(",")[0]} →{" "}
                {bid.load.dropAddress.split(",")[0]}
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)]">
                {bid.load.materialType.toLowerCase()} · {bid.load.weight} MT ·
                bid {formatRelativeTime(bid.submittedAt)}
              </p>
            </div>

            <div className="text-right shrink-0 space-y-1">
              <p className="text-sm font-semibold">
                {formatCurrency(bid.amount)}
              </p>
              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium",
                  isLeading
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : config.color
                )}
              >
                {isLeading ? "Leading" : config.label}
              </span>
              {lowestBid && !isLeading && (
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  Best: {formatCurrency(lowestBid)}
                </p>
              )}
            </div>

            <ArrowRight className="size-3.5 text-[var(--muted-foreground)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        );
      })}
    </div>
  );
}

// ── Open Loads ────────────────────────────────────────────
async function OpenLoads({ transporterId }: { transporterId: string }) {
  const loads = await getOpenLoadsNearby(transporterId);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {loads.map((load) => (
        <Link
          key={load.id}
          href={`/transporter/loads/${load.id}` as Route}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--primary)]/40 hover:bg-[var(--muted)]/30 transition-all group"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <span className="font-mono text-xs font-medium text-[var(--primary)]">
              {load.loadNumber}
            </span>
            <LoadStatusBadge status={load.status} />
          </div>
          <p className="text-sm font-medium truncate mb-1">
            {load.pickupAddress.split(",")[0]} → {load.dropAddress.split(",")[0]}
          </p>
          <p className="text-xs text-[var(--muted-foreground)] mb-3 capitalize">
            {load.materialType.toLowerCase()} · {load.weight} MT
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[var(--muted-foreground)]">
                Best bid
              </p>
              <p className="text-sm font-semibold text-emerald-500">
                {load.bids[0]
                  ? formatCurrency(load.bids[0].amount)
                  : "No bids yet"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[var(--muted-foreground)]">
                Bids
              </p>
              <p className="text-sm font-medium">{load._count.bids}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────
export default async function TransporterDashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${session!.user.name?.split(" ")[0] ?? "Transporter"}`}
        description="Track your bids and discover new loads."
        icon={TrendingUp}
      />

      <Suspense fallback={<MetricsSkeleton />}>
        <TransporterMetrics transporterId={session!.user.id} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Gavel className="size-4 text-[var(--muted-foreground)]" />
              Your Active Bids
            </h3>
            <Button variant="ghost" size="sm" className="text-xs h-7" nativeButton={false} render={<Link href={"/transporter/bids" as Route}/>}>
              View all
            </Button>
          </div>
          <Suspense fallback={<BidsSkeleton />}>
            <ActiveBids transporterId={session!.user.id} />
          </Suspense>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="size-4 text-[var(--muted-foreground)]" />
              Open Loads Near You
            </h3>
            <Button variant="ghost" size="sm" className="text-xs h-7" nativeButton={false} render ={<Link href={"/transporter/loads" as Route}/>}>
              Browse all
            </Button>
          </div>
          <Suspense fallback={<LoadCardsSkeleton />}>
            <OpenLoads transporterId={session!.user.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--metric-bg)] p-4 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

function BidsSkeleton() {
  return (
    <div className="space-y-1 rounded-lg border border-[var(--border)] overflow-hidden">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-[var(--border)] last:border-0">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

function LoadCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-[var(--border)] p-4 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}
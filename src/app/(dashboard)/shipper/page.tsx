import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MetricCard } from "../../../components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package, Gavel, Wallet, CheckCircle,
  TrendingUp, Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { LoadStatusBadge } from "../../../components/loads/load-status-badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { Route } from "next";

// ── PPR: Static shell + dynamic data ──────────────────────
export const experimental_ppr = true;

// ── Data Fetchers ──────────────────────────────────────────
async function getShipperMetrics(shipperId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeLoads, liveBids, escrow, deliveredMTD] = await Promise.all([
    prisma.load.count({
      where: {
        shipperId,
        status: { in: ["OPEN", "BIDDING_CLOSED", "IN_TRANSIT", "ARRIVED"] },
      },
    }),
    prisma.bid.count({
      where: { load: { shipperId }, status: "ACTIVE" },
    }),
    prisma.escrowTransaction.aggregate({
      where: { load: { shipperId }, isReleased: false },
      _sum: { amount: true },
    }),
    prisma.load.count({
      where: {
        shipperId,
        status: "DELIVERED",
        deliveredAt: { gte: startOfMonth },
      },
    }),
  ]);

  return {
    activeLoads,
    liveBids,
    escrowHeld: escrow._sum.amount ?? 0,
    deliveredMTD,
  };
}

async function getRecentLoads(shipperId: string) {
  return prisma.load.findMany({
    where: { shipperId },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      _count: { select: { bids: true } },
      bids: {
        where: { status: "ACTIVE" },
        orderBy: { amount: "asc" },
        take: 1,
        select: { amount: true },
      },
    },
  });
}

// ── Metrics Section ──────────────────────────────────────
async function ShipperMetrics({ shipperId }: { shipperId: string }) {
  const metrics = await getShipperMetrics(shipperId);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard
        label="Active Loads"
        value={metrics.activeLoads}
        sub="Across all stages"
        icon={Package}
      />
      <MetricCard
        label="Live Bids"
        value={metrics.liveBids}
        sub="Across active loads"
        subVariant="neutral"
        icon={Gavel}
        iconColor="bg-purple-500/10 text-purple-500"
      />
      <MetricCard
        label="Escrow Held"
        value={formatCurrency(metrics.escrowHeld)}
        sub="Pending delivery"
        icon={Wallet}
        iconColor="bg-amber-500/10 text-amber-500"
      />
      <MetricCard
        label="Delivered (MTD)"
        value={metrics.deliveredMTD}
        sub="This month"
        subVariant="up"
        icon={CheckCircle}
        iconColor="bg-emerald-500/10 text-emerald-500"
      />
    </div>
  );
}

// ── Recent Loads Table ───────────────────────────────────
async function RecentLoads({ shipperId }: { shipperId: string }) {
  const loads = await getRecentLoads(shipperId);

  if (loads.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] border-dashed bg-[var(--card)] p-12 text-center">
        <Package className="size-8 text-[var(--muted-foreground)] mx-auto mb-3" />
        <p className="text-sm font-medium">No loads yet</p>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          Post your first load to start receiving bids
        </p>
        <Button size="sm" className="mt-4" nativeButton={false} render={<Link href={"/shipper/loads/new" as Route}/>}>
          Post a Load
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/40">
              {[
                "Load ID", "Route", "Material",
                "Weight", "Status", "Bids",
                "Best Bid", "Closes",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)] whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loads.map((load) => (
              <tr
                key={load.id}
                className="hover:bg-[var(--muted)]/30 transition-colors cursor-pointer group"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/shipper/loads/${load.id}` as Route}
                    className="font-mono text-xs font-medium text-[var(--primary)] group-hover:underline"
                  >
                    {load.loadNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--muted-foreground)] max-w-[180px]">
                  <span className="truncate block">
                    {load.pickupAddress.split(",")[0]} →{" "}
                    {load.dropAddress.split(",")[0]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs capitalize">
                  {load.materialType.toLowerCase()}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                  {load.weight} MT
                </td>
                <td className="px-4 py-3">
                  <LoadStatusBadge status={load.status} />
                </td>
                <td className="px-4 py-3 text-xs font-medium">
                  {load._count.bids}
                </td>
                <td className="px-4 py-3 text-xs font-medium text-emerald-500">
                  {load.bids[0]
                    ? formatCurrency(load.bids[0].amount)
                    : <span className="text-[var(--muted-foreground)]">—</span>
                  }
                </td>
                <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                  {load.status === "OPEN"
                    ? format(load.biddingClosesAt, "dd MMM · HH:mm")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────
export default async function ShipperDashboardPage() {
  const session = await auth();
  const shipperId = session!.user.id;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good ${getGreeting()}, ${session!.user.name?.split(" ")[0] ?? "Shipper"}`}
        description="Here's what's happening with your loads today."
        icon={TrendingUp}
      >
        <Button size="sm" nativeButton={false} render={<Link href={"/shipper/loads/new" as Route}/>}>
          
            <Package className="size-3.5 mr-1.5" />
            Post Load
        </Button>
      </PageHeader>

      {/* Metrics — dynamic */}
      <Suspense fallback={<MetricsSkeleton />}>
        <ShipperMetrics shipperId={shipperId} />
      </Suspense>

      {/* Recent Loads — dynamic */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-[var(--muted-foreground)]" />
            <h3 className="text-sm font-medium">Recent Loads</h3>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7" nativeButton={false} render={<Link href={"/shipper/loads" as Route}/>}>
            View all
          </Button>
        </div>
        <Suspense fallback={<TableSkeleton />}>
          <RecentLoads shipperId={shipperId} />
        </Suspense>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--metric-bg)] p-4 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="p-3 border-b border-[var(--border)] bg-[var(--muted)]/40">
        <Skeleton className="h-3 w-40" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-[var(--border)] last:border-0">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
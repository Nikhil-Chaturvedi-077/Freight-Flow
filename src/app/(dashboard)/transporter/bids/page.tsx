import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { MyBidsTable } from "@/components/bids/my-bids-table";
import { EmptyState } from "../../../../components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/shared/metric-card";
import { Gavel, TrendingDown, CheckCircle, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Bids" };
export const experimental_ppr = true;

async function BidMetrics({ transporterId }: { transporterId: string }) {
  const [active, leading, won, lost] = await Promise.all([
    prisma.bid.count({
      where: { transporterId, status: { in: ["ACTIVE", "OUTBID"] } },
    }),
    prisma.bid.count({
      where: { transporterId, status: "ACTIVE" },
    }),
    prisma.bid.count({
      where: { transporterId, status: "ACCEPTED" },
    }),
    prisma.bid.count({
      where: { transporterId, status: "REJECTED" },
    }),
  ]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard
        label="Active Bids"
        value={active}
        sub="Across open loads"
        icon={Gavel}
      />
      <MetricCard
        label="Leading"
        value={leading}
        sub="Currently lowest bid"
        subVariant="up"
        icon={TrendingDown}
        className="bg-emerald-500/10 text-emerald-500"
      />
      <MetricCard
        label="Won"
        value={won}
        sub="Loads assigned to you"
        subVariant="up"
        icon={CheckCircle}
        className="bg-emerald-500/10 text-emerald-500"
      />
      <MetricCard
        label="Not Selected"
        value={lost}
        icon={XCircle}
        className="bg-slate-500/10 text-slate-500"
      />
    </div>
  );
}

async function BidsList({ transporterId }: { transporterId: string }) {
  const bids = await prisma.bid.findMany({
    where: { transporterId },
    orderBy: { submittedAt: "desc" },
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

  if (bids.length === 0) {
    return (
      <EmptyState
        icon={Gavel}
        title="No bids yet"
        description="Browse open loads and place your first bid"
      />
    );
  }

  return <MyBidsTable bids={bids} />;
}

export default async function MyBidsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6 max-w-screen-xl">
      <PageHeader
        title="My Bids"
        description="Track all your bids across loads"
        icon={Gavel}
      />

      <Suspense
        fallback={
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--border)] bg-[var(--metric-bg)] p-4 space-y-3"
              >
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-12" />
              </div>
            ))}
          </div>
        }
      >
        <BidMetrics transporterId={session.user.id} />
      </Suspense>

      <Suspense
        fallback={
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 px-4 py-3.5 border-b border-[var(--border)] last:border-0"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        }
      >
        <BidsList transporterId={session.user.id} />
      </Suspense>
    </div>
  );
}
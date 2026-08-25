import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3, TrendingUp, Users, Package,
  Wallet, CheckCircle, Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AdminRevenueChart } from "@/components/admin/admin-revenue-chart";
import { AdminLoadVolumeChart } from "@/components/admin/admin-load-volume-chart";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics" };
export const experimental_ppr = true;

async function PlatformMetrics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalUsers, newUsersMTD, totalLoads, loadsMTD,
    deliveredLoads, totalRevenue, revenueMTD,
    avgBidsPerLoad, totalTransporters, totalShippers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.load.count(),
    prisma.load.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.load.count({ where: { status: "DELIVERED" } }),
    prisma.escrowTransaction.aggregate({
      where: { isReleased: true },
      _sum: { amount: true },
    }),
    prisma.escrowTransaction.aggregate({
      where: { isReleased: true, releasedAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.bid.groupBy({
      by: ["loadId"],
      _count: { id: true },
    }).then((groups) => {
      if (groups.length === 0) return 0;
      const total = groups.reduce((sum, g) => sum + g._count.id, 0);
      return (total / groups.length).toFixed(1);
    }),
    prisma.user.count({ where: { role: "TRANSPORTER" } }),
    prisma.user.count({ where: { role: "SHIPPER" } }),
  ]);

  // Monthly revenue for chart (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleString("en-IN", { month: "short" }),
    };
  });

  const monthlyRevenue = await Promise.all(
    months.map(async (m) => {
      const start = new Date(m.year, m.month, 1);
      const end = new Date(m.year, m.month + 1, 0);
      const result = await prisma.escrowTransaction.aggregate({
        where: {
          isReleased: true,
          releasedAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      });
      return {
        month: m.label,
        revenue: result._sum.amount ?? 0,
        fee: (result._sum.amount ?? 0) * 0.025,
      };
    })
  );

  // Monthly load volume
  const monthlyLoads = await Promise.all(
    months.map(async (m) => {
      const start = new Date(m.year, m.month, 1);
      const end = new Date(m.year, m.month + 1, 0);
      const [posted, delivered] = await Promise.all([
        prisma.load.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.load.count({
          where: { deliveredAt: { gte: start, lte: end }, status: "DELIVERED" },
        }),
      ]);
      return { month: m.label, posted, delivered };
    })
  );

  const deliveryRate =
    totalLoads > 0
      ? Math.round((deliveredLoads / totalLoads) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Total Users"
          value={totalUsers}
          sub={`+${newUsersMTD} this month`}
          subVariant="up"
          icon={Users}
        />
        <MetricCard
          label="Total Loads"
          value={totalLoads}
          sub={`+${loadsMTD} this month`}
          subVariant="up"
          icon={Package}
        />
        <MetricCard
          label="Platform Revenue"
          value={formatCurrency((totalRevenue._sum.amount ?? 0) * 0.025)}
          sub={`${formatCurrency((revenueMTD._sum.amount ?? 0) * 0.025)} this month`}
          subVariant="up"
          icon={Wallet}
          className="bg-emerald-500/10 text-emerald-500"
        />
        <MetricCard
          label="Delivery Rate"
          value={`${deliveryRate}%`}
          sub={`${deliveredLoads} of ${totalLoads} delivered`}
          subVariant={deliveryRate >= 80 ? "up" : "neutral"}
          icon={CheckCircle}
          className="bg-blue-500/10 text-blue-500"
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Shippers" value={totalShippers} icon={Package} />
        <MetricCard label="Transporters" value={totalTransporters} icon={Users} />
        <MetricCard
          label="Avg Bids/Load"
          value={avgBidsPerLoad}
          icon={TrendingUp}
        />
        <MetricCard
          label="Total Escrow Volume"
          value={formatCurrency(totalRevenue._sum.amount ?? 0)}
          icon={Wallet}
          className="bg-amber-500/10 text-amber-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="text-sm font-semibold mb-1">
            Revenue & Platform Fee (6 months)
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">
            Escrow volume vs platform earnings
          </p>
          <AdminRevenueChart data={monthlyRevenue} />
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="text-sm font-semibold mb-1">
            Load Volume (6 months)
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">
            Loads posted vs delivered
          </p>
          <AdminLoadVolumeChart data={monthlyLoads} />
        </div>
      </div>
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/shipper");

  return (
    <div className="space-y-5 max-w-screen-xl">
      <PageHeader
        title="Analytics"
        description="Platform-wide performance and revenue insights"
        icon={BarChart3}
      />

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-[var(--border)] p-4 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-16" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-72 rounded-xl" />
              <Skeleton className="h-72 rounded-xl" />
            </div>
          </div>
        }
      >
        <PlatformMetrics />
      </Suspense>
    </div>
  );
}
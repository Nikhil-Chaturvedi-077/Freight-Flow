import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Package, Landmark, ShieldAlert,
  ShieldCheck, Clock, Activity,
} from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Route } from "next";

export const experimental_ppr = true;

async function getAdminMetrics() {
  const startOfMonth = new Date(
    new Date().getFullYear(), new Date().getMonth(), 1
  );

  const [
    totalUsers, totalLoads, activeLoads,
    pendingKYC, escrowTotal, deliveredMTD,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.load.count(),
    prisma.load.count({
      where: { status: { in: ["OPEN", "BIDDING_CLOSED", "IN_TRANSIT"] } },
    }),
    prisma.user.count({ where: { kycStatus: "PENDING" } }),
    prisma.escrowTransaction.aggregate({
      where: { isReleased: false },
      _sum: { amount: true },
    }),
    prisma.load.count({
      where: { status: "DELIVERED", deliveredAt: { gte: startOfMonth } },
    }),
  ]);

  return {
    totalUsers, totalLoads, activeLoads,
    pendingKYC, deliveredMTD,
    escrowTotal: escrowTotal._sum.amount ?? 0,
  };
}

async function getRecentUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true, name: true, email: true,
      role: true, kycStatus: true, createdAt: true,
      companyName: true,
    },
  });
}

async function getRecentLoads() {
  return prisma.load.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      shipper: { select: { companyName: true, name: true } },
      _count: { select: { bids: true } },
    },
  });
}

// ── Admin Metrics ─────────────────────────────────────────
async function AdminMetrics() {
  const m = await getAdminMetrics();
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <MetricCard label="Total Users" value={m.totalUsers} icon={Users} />
      <MetricCard label="Total Loads" value={m.totalLoads} icon={Package} />
      <MetricCard
        label="Active Loads"
        value={m.activeLoads}
        subVariant="up"
        icon={Activity}
      />
      <MetricCard
        label="KYC Pending"
        value={m.pendingKYC}
        subVariant={m.pendingKYC > 10 ? "down" : "neutral"}
        icon={ShieldAlert}
        iconColor="bg-amber-500/10 text-amber-500"
      />
      <MetricCard
        label="Escrow Held"
        value={formatCurrency(m.escrowTotal)}
        icon={Landmark}
        iconColor="bg-blue-500/10 text-blue-500"
      />
      <MetricCard
        label="Delivered (MTD)"
        value={m.deliveredMTD}
        subVariant="up"
        icon={ShieldCheck}
        iconColor="bg-emerald-500/10 text-emerald-500"
      />
    </div>
  );
}

// ── Recent Users ──────────────────────────────────────────
async function RecentUsers() {
  const users = await getRecentUsers();
  const KYC_COLORS = {
    PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    VERIFIED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    REJECTED: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/40">
              {["User", "Role", "KYC", "Joined"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-xs font-medium">{user.companyName ?? user.name}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={cn(
                    "text-[10px]",
                    user.role === "SHIPPER"
                      ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      : user.role === "TRANSPORTER"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  )}>
                    {user.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium",
                    KYC_COLORS[user.kycStatus]
                  )}>
                    {user.kycStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                  {formatRelativeTime(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Recent Loads ──────────────────────────────────────────
async function RecentLoadsAdmin() {
  const loads = await getRecentLoads();
  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/40">
              {["Load ID", "Shipper", "Route", "Status", "Bids"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)] whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loads.map((load) => (
              <tr key={load.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-medium text-[var(--primary)]">
                  {load.loadNumber}
                </td>
                <td className="px-4 py-3 text-xs">
                  {load.shipper.companyName ?? load.shipper.name}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                  {load.pickupAddress.split(",")[0]} → {load.dropAddress.split(",")[0]}
                </td>
                <td className="px-4 py-3">
                  <LoadStatusBadge status={load.status} />
                </td>
                <td className="px-4 py-3 text-xs font-medium">
                  {load._count.bids}
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
export default async function AdminDashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Command Center"
        description="Platform health, users, and financial overview."
        icon={Activity}
      />

      <Suspense fallback={
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--metric-bg)] p-4 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-12" />
            </div>
          ))}
        </div>
      }>
        <AdminMetrics />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Users className="size-4 text-[var(--muted-foreground)]" />
              Recent Signups
            </h3>
            <Button variant="ghost" size="sm" className="text-xs h-7" nativeButton={false} render={<Link href={"/admin/users" as Route}/>}>
              View all
            </Button>
          </div>
          <Suspense fallback={<TableSkeleton />}>
            <RecentUsers />
          </Suspense>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Clock className="size-4 text-[var(--muted-foreground)]" />
              Recent Loads
            </h3>
            <Button variant="ghost" size="sm" className="text-xs h-7" nativeButton={false} render = {<Link href={"/admin/loads" as Route}/>}>
              View all
            </Button>
          </div>
          <Suspense fallback={<TableSkeleton />}>
            <RecentLoadsAdmin />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="p-3 border-b border-[var(--border)] bg-[var(--muted)]/40">
        <Skeleton className="h-3 w-32" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-[var(--border)] last:border-0">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
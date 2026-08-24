import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settlements" };
export const experimental_ppr = true;

async function SettlementsData() {
  const [held, released, escrows] = await Promise.all([
    prisma.escrowTransaction.aggregate({
      where: { isReleased: false },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.escrowTransaction.aggregate({
      where: { isReleased: true },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.escrowTransaction.findMany({
      orderBy: { heldAt: "desc" },
      take: 30,
      include: {
        load: {
          select: {
            loadNumber: true,
            status: true,
            pickupAddress: true,
            dropAddress: true,
            shipperId: true,
            shipper: {
              select: { name: true, companyName: true },
            },
            acceptedBid: {
              include: {
                transporter: {
                  select: { name: true, companyName: true },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const platformRevenue =
    (released._sum.amount ?? 0) * 0.025;

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Currently Held"
          value={formatCurrency(held._sum.amount ?? 0)}
          sub={`${held._count} active`}
          icon={Clock}
          className="bg-amber-500/10 text-amber-500"
        />
        <MetricCard
          label="Total Released"
          value={formatCurrency(released._sum.amount ?? 0)}
          sub={`${released._count} completed`}
          subVariant="up"
          icon={CheckCircle}
          className="bg-emerald-500/10 text-emerald-500"
        />
        <MetricCard
          label="Platform Revenue"
          value={formatCurrency(platformRevenue)}
          sub="2.5% of released"
          icon={TrendingUp}
          className="bg-blue-500/10 text-blue-500"
        />
        <MetricCard
          label="Total Volume"
          value={formatCurrency(
            (held._sum.amount ?? 0) + (released._sum.amount ?? 0)
          )}
          icon={Landmark}
        />
      </div>

      {/* Escrow table */}
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 bg-[var(--muted)]/40 border-b border-[var(--border)]">
          {[
            { label: "Load", span: 2 },
            { label: "Shipper", span: 2 },
            { label: "Transporter", span: 2 },
            { label: "Route", span: 3 },
            { label: "Amount", span: 1 },
            { label: "Status", span: 2 },
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

        <div className="divide-y divide-[var(--border)]">
          {escrows.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3.5 hover:bg-[var(--muted)]/20 transition-colors"
            >
              <div className="md:col-span-2">
                <p className="font-mono text-xs font-semibold text-[var(--primary)]">
                  {e.load.loadNumber}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                  {formatDateTime(e.heldAt)}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="text-xs">
                  {e.load.shipper.companyName ?? e.load.shipper.name}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="text-xs">
                  {e.load.acceptedBid?.transporter.companyName ??
                    e.load.acceptedBid?.transporter.name ??
                    "—"}
                </p>
              </div>

              <div className="md:col-span-3">
                <p className="text-xs truncate">
                  {e.load.pickupAddress.split(",")[0]} →{" "}
                  {e.load.dropAddress.split(",")[0]}
                </p>
              </div>

              <div className="md:col-span-1">
                <p className="text-xs font-semibold">
                  {formatCurrency(e.amount)}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  Fee: {formatCurrency(e.amount * 0.025)}
                </p>
              </div>

              <div className="md:col-span-2 flex items-center">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium",
                    e.isReleased
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  )}
                >
                  {e.isReleased ? (
                    <>
                      <CheckCircle className="size-2.5 mr-1" />
                      Released
                    </>
                  ) : (
                    <>
                      <Clock className="size-2.5 mr-1" />
                      Held
                    </>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function AdminSettlementsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/shipper");

  return (
    <div className="space-y-5 max-w-screen-xl">
      <PageHeader
        title="Settlements"
        description="Platform escrow and payment settlement overview"
        icon={Landmark}
      />

      <Suspense
        fallback={
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[var(--border)] p-4 space-y-2"
                >
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-24" />
                </div>
              ))}
            </div>
          </div>
        }
      >
        <SettlementsData />
      </Suspense>
    </div>
  );
}
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import {
  Wallet, Shield, CheckCircle,
  ArrowRight, Clock,
} from "lucide-react";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { releaseEscrow } from "@/actions/wallet.actions";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Escrow Wallet" };
export const experimental_ppr = true;

async function EscrowData({ shipperId }: { shipperId: string }) {
  const [escrowHeld, totalSpent, escrows] = await Promise.all([
    prisma.escrowTransaction.aggregate({
      where: { load: { shipperId }, isReleased: false },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.escrowTransaction.aggregate({
      where: { load: { shipperId }, isReleased: true },
      _sum: { amount: true },
    }),
    prisma.escrowTransaction.findMany({
      where: { load: { shipperId } },
      orderBy: { heldAt: "desc" },
      take: 20,
      include: {
        load: {
          select: {
            id: true,
            loadNumber: true,
            pickupAddress: true,
            dropAddress: true,
            status: true,
            deliveredAt: true,
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

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard
          label="Currently Held"
          value={formatCurrency(escrowHeld._sum.amount ?? 0)}
          sub={`${escrowHeld._count} active escrow${escrowHeld._count !== 1 ? "s" : ""}`}
          icon={Shield}
          className="bg-amber-500/10 text-amber-500"
        />
        <MetricCard
          label="Total Released"
          value={formatCurrency(totalSpent._sum.amount ?? 0)}
          sub="Paid to transporters"
          subVariant="up"
          icon={CheckCircle}
          className="bg-emerald-500/10 text-emerald-500"
        />
        <MetricCard
          label="Total Transacted"
          value={formatCurrency(
            (escrowHeld._sum.amount ?? 0) + (totalSpent._sum.amount ?? 0)
          )}
          sub="All time"
          icon={Wallet}
        />
      </div>

      {/* Escrow list */}
      {escrows.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No escrow transactions"
          description="When you accept a bid, payment will be held in escrow until delivery"
        />
      ) : (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-2.5 bg-[var(--muted)]/40 border-b border-[var(--border)]">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              Transaction History
            </p>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {escrows.map((escrow) => {
              const load = escrow.load;
              const canRelease =
                load.status === "DELIVERED" && !escrow.isReleased;

              return (
                <div
                  key={escrow.id}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-[var(--muted)]/20 transition-colors"
                >
                  {/* Status icon */}
                  <div
                    className={cn(
                      "size-9 rounded-lg flex items-center justify-center shrink-0",
                      escrow.isReleased
                        ? "bg-emerald-500/10"
                        : "bg-amber-500/10"
                    )}
                  >
                    {escrow.isReleased ? (
                      <CheckCircle className="size-4 text-emerald-500" />
                    ) : (
                      <Shield className="size-4 text-amber-500" />
                    )}
                  </div>

                  {/* Load info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/shipper/loads/${load.id}`}
                        className="font-mono text-xs font-semibold text-[var(--primary)] hover:underline"
                      >
                        {load.loadNumber}
                      </Link>
                      <LoadStatusBadge status={load.status} />
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
                      {load.pickupAddress.split(",")[0]} →{" "}
                      {load.dropAddress.split(",")[0]}
                    </p>
                    {load.acceptedBid && (
                      <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                        Transporter:{" "}
                        {load.acceptedBid.transporter.companyName ??
                          load.acceptedBid.transporter.name}
                      </p>
                    )}
                  </div>

                  {/* Amount + date */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">
                      {formatCurrency(escrow.amount)}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                      {escrow.isReleased && escrow.releasedAt
                        ? `Released ${formatDateTime(escrow.releasedAt)}`
                        : `Held ${formatDateTime(escrow.heldAt)}`}
                    </p>
                  </div>

                  {/* Action */}
                  {canRelease ? (
                    <form
                      action={async () => {
                        "use server";
                        await releaseEscrow(load.id);
                      }}
                    >
                      <Button
                        type="submit"
                        size="sm"
                        className="h-7 text-xs shrink-0 gap-1.5"
                      >
                        <CheckCircle className="size-3" />
                        Release
                      </Button>
                    </form>
                  ) : (
                    <span
                      className={cn(
                        "text-[10px] font-medium px-2 py-1 rounded-md shrink-0",
                        escrow.isReleased
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600"
                      )}
                    >
                      {escrow.isReleased ? "Released" : "Held"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function ShipperWalletPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-5 max-w-screen-lg">
      <PageHeader
        title="Escrow Wallet"
        description="Track payments held in escrow and release on delivery"
        icon={Wallet}
      />

      <div className="rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 px-4 py-3 flex items-start gap-3">
        <Shield className="size-4 text-[var(--primary)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
          Payments are held securely in escrow when you accept a bid.
          Release funds only after confirming delivery. Platform fee of
          2.5% applies on each transaction.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[var(--border)] p-4 space-y-2"
                >
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-24" />
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex gap-4 px-4 py-3.5 border-b border-[var(--border)] last:border-0"
                >
                  <Skeleton className="size-9 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        }
      >
        <EscrowData shipperId={session.user.id} />
      </Suspense>
    </div>
  );
}
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, CheckCircle, Package } from "lucide-react";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Wallet" };
export const experimental_ppr = true;

async function WalletData({ transporterId }: { transporterId: string }) {
  const [wallet, earnings] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId: transporterId },
    }),
    prisma.escrowTransaction.findMany({
      where: {
        load: { acceptedBid: { transporterId } },
        isReleased: true,
      },
      orderBy: { releasedAt: "desc" },
      take: 20,
      include: {
        load: {
          select: {
            id: true,
            loadNumber: true,
            pickupAddress: true,
            dropAddress: true,
            deliveredAt: true,
            materialType: true,
            weight: true,
          },
        },
      },
    }),
  ]);

  const balance = wallet?.balance ?? 0;
  const totalEarned = wallet?.totalEarned ?? 0;
  const platformFees = totalEarned * 0.025;

  return (
    <div className="space-y-6">
      {/* Balance card */}
      <div className="rounded-xl border border-[var(--primary)]/30 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 p-6">
        <p className="text-sm text-[var(--muted-foreground)] mb-1">
          Available Balance
        </p>
        <p className="text-4xl font-bold tracking-tight">
          {formatCurrency(balance)}
        </p>
        <p className="text-xs text-[var(--muted-foreground)] mt-2">
          Total earned: {formatCurrency(totalEarned)} · Platform
          fees: {formatCurrency(platformFees)}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard
          label="Total Earned"
          value={formatCurrency(totalEarned)}
          sub="All completed loads"
          subVariant="up"
          icon={TrendingUp}
          className="bg-emerald-500/10 text-emerald-500"
        />
        <MetricCard
          label="Completed Loads"
          value={earnings.length}
          sub="Delivered & paid"
          icon={CheckCircle}
          className="bg-blue-500/10 text-blue-500"
        />
        <MetricCard
          label="Avg Per Load"
          value={
            earnings.length > 0
              ? formatCurrency(totalEarned / earnings.length)
              : "₹0"
          }
          icon={Package}
        />
      </div>

      {/* Earnings history */}
      {earnings.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No earnings yet"
          description="Complete deliveries to start earning. Your payments will appear here."
        />
      ) : (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="px-4 py-2.5 bg-[var(--muted)]/40 border-b border-[var(--border)]">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              Earnings History
            </p>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {earnings.map((e) => {
              const netAmount = e.amount * 0.975; // after 2.5% fee

              return (
                <div
                  key={e.id}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-[var(--muted)]/20 transition-colors"
                >
                  {/* Icon */}
                  <div className="size-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="size-4 text-emerald-500" />
                  </div>

                  {/* Load info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs font-semibold text-[var(--primary)]">
                      {e.load.loadNumber}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
                      {e.load.pickupAddress.split(",")[0]} →{" "}
                      {e.load.dropAddress.split(",")[0]}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      {e.load.materialType.toLowerCase()} · {e.load.weight} MT
                      {e.load.deliveredAt &&
                        ` · Delivered ${formatDateTime(e.load.deliveredAt)}`}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(netAmount)}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      after 2.5% fee
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function TransporterWalletPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-5 max-w-screen-lg">
      <PageHeader
        title="My Wallet"
        description="Track your earnings from completed deliveries"
        icon={Wallet}
      />

      <Suspense
        fallback={
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-xl" />
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
          </div>
        }
      >
        <WalletData transporterId={session.user.id} />
      </Suspense>
    </div>
  );
}
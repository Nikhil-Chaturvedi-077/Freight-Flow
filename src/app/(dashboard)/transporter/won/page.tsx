import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "../../../../components/shared/empty-state";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  CheckSquare, ArrowRight, MapPin,
  Package, Clock,
} from "lucide-react";
import {
  cn, formatCurrency, formatDateTime, formatRelative,
} from "@/lib/utils";
import Link from "next/link";
import type { Metadata, Route } from "next";

export const metadata: Metadata = { title: "Won Loads" };
export const experimental_ppr = true;

async function WonLoadsList({ transporterId }: { transporterId: string }) {
  const wonBids = await prisma.bid.findMany({
    where: {
      transporterId,
      status: "ACCEPTED",
    },
    orderBy: { updatedAt: "desc" },
    include: {
      load: {
        select: {
          id: true,
          loadNumber: true,
          pickupAddress: true,
          dropAddress: true,
          materialType: true,
          packagingType: true,
          weight: true,
          status: true,
          createdAt: true,
          inTransitAt: true,
          deliveredAt: true,
          biddingClosesAt: true,
          shipper: {
            select: { name: true, companyName: true },
          },
        },
      },
    },
  });

  if (wonBids.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No won loads yet"
        description="Win bids on loads to see them here"
      >
        <Button size="sm" nativeButton={false} render={<Link href={"/transporter/loads" as Route}/>}>
          Browse Loads
        </Button>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-3">
      {wonBids.map((bid) => {
        const load = bid.load;
        return (
          <Link
            key={bid.id}
            href={`/transporter/loads/${load.id}` as Route}
            className={cn(
              "block rounded-xl border border-[var(--border)] bg-[var(--card)]",
              "p-4 hover:border-[var(--primary)]/30 hover:shadow-sm",
              "transition-all duration-150 group"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Load info */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-semibold text-[var(--primary)]">
                    {load.loadNumber}
                  </span>
                  <LoadStatusBadge status={load.status} />
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Won {formatRelative(bid.updatedAt)}
                  </span>
                </div>

                {/* Route */}
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="size-1.5 rounded-full bg-emerald-500" />
                    <span className="font-medium">
                      {load.pickupAddress.split(",")[0]}
                    </span>
                  </div>
                  <ArrowRight className="size-3.5 text-[var(--muted-foreground)] shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <div className="size-1.5 rounded-full bg-red-500" />
                    <span className="font-medium">
                      {load.dropAddress.split(",")[0]}
                    </span>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                    <Package className="size-3" />
                    {load.materialType.toLowerCase()} · {load.weight} MT
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Shipper:{" "}
                    {load.shipper.companyName ?? load.shipper.name}
                  </span>
                </div>

                {/* Timeline chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    {
                      label: "Assigned",
                      date: bid.updatedAt,
                      done: true,
                    },
                    {
                      label: "In Transit",
                      date: load.inTransitAt,
                      done: !!load.inTransitAt,
                    },
                    {
                      label: "Delivered",
                      date: load.deliveredAt,
                      done: !!load.deliveredAt,
                    },
                  ].map((step) => (
                    <div
                      key={step.label}
                      className={cn(
                        "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border",
                        step.done
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-[var(--border)]"
                      )}
                    >
                      <div
                        className={cn(
                          "size-1.5 rounded-full",
                          step.done
                            ? "bg-emerald-500"
                            : "bg-[var(--border)]"
                        )}
                      />
                      {step.label}
                      {step.done && step.date && (
                        <span className="opacity-70 hidden sm:inline">
                          · {formatDateTime(step.date)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bid amount */}
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(bid.amount)}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Your winning bid
                </p>
                <ArrowRight
                  className={cn(
                    "size-4 text-[var(--muted-foreground)] mt-2 ml-auto",
                    "opacity-0 group-hover:opacity-100",
                    "transition-opacity duration-150"
                  )}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default async function WonLoadsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [wonCount, inTransitCount, deliveredCount] = await Promise.all([
    prisma.bid.count({
      where: { transporterId: session.user.id, status: "ACCEPTED" },
    }),
    prisma.load.count({
      where: {
        acceptedBid: { transporterId: session.user.id },
        status: "IN_TRANSIT",
      },
    }),
    prisma.load.count({
      where: {
        acceptedBid: { transporterId: session.user.id },
        status: "DELIVERED",
      },
    }),
  ]);

  return (
    <div className="space-y-5 max-w-screen-lg">
      <PageHeader
        title="Won Loads"
        description="Loads assigned to you"
        icon={CheckSquare}
      />

      {/* Stats strip */}
      <div className="flex items-center gap-4 text-sm">
        {[
          { label: "Total Won", value: wonCount },
          { label: "In Transit", value: inTransitCount, color: "text-amber-500" },
          { label: "Delivered", value: deliveredCount, color: "text-emerald-500" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span
              className={cn(
                "font-semibold text-base",
                s.color ?? "text-[var(--foreground)]"
              )}
            >
              {s.value}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--border)] p-4 space-y-2"
              >
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-56" />
              </div>
            ))}
          </div>
        }
      >
        <WonLoadsList transporterId={session.user.id} />
      </Suspense>
    </div>
  );
}
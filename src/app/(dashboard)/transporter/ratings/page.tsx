import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Star, TrendingUp, Package } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Ratings" };

export default async function TransporterRatingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.transporterProfile.findUnique({
    where: { userId: session.user.id },
    select: { rating: true, ratingCount: true, totalTrips: true },
  });

  const wonLoads = await prisma.load.findMany({
    where: {
      acceptedBid: { transporterId: session.user.id },
      status: "DELIVERED",
    },
    orderBy: { deliveredAt: "desc" },
    select: {
      id: true,
      loadNumber: true,
      pickupAddress: true,
      dropAddress: true,
      materialType: true,
      weight: true,
      deliveredAt: true,
      shipper: {
        select: { name: true, companyName: true },
      },
    },
  });

  const rating = profile?.rating ?? 0;
  const ratingCount = profile?.ratingCount ?? 0;
  const totalTrips = profile?.totalTrips ?? 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="My Ratings"
        description="Your performance on Freight-Flow"
        icon={Star}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          label="Overall Rating"
          value={rating > 0 ? `${rating.toFixed(1)} ★` : "New"}
          sub={`${ratingCount} reviews`}
          icon={Star}
          className="bg-amber-500/10 text-amber-500"
        />
        <MetricCard
          label="Total Trips"
          value={totalTrips}
          sub="Completed loads"
          subVariant="up"
          icon={Package}
        />
        <MetricCard
          label="Performance"
          value={
            rating >= 4.5
              ? "Excellent"
              : rating >= 4
              ? "Very Good"
              : rating >= 3
              ? "Good"
              : rating > 0
              ? "Fair"
              : "New"
          }
          icon={TrendingUp}
          className="bg-emerald-500/10 text-emerald-500"
        />
      </div>

      {/* Rating bar */}
      {rating > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
          <h3 className="text-sm font-semibold">Rating Breakdown</h3>
          <div className="flex items-center gap-3">
            <div className="text-4xl font-bold">{rating.toFixed(1)}</div>
            <div className="flex-1">
              <div className="flex gap-0.5 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      "size-5",
                      s <= Math.round(rating)
                        ? "text-amber-400 fill-amber-400"
                        : "text-[var(--border)]"
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Based on {ratingCount} rating{ratingCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Completed loads */}
      {wonLoads.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No completed loads yet"
          description="Complete deliveries to start building your rating"
        />
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">
            Completed Deliveries ({wonLoads.length})
          </h3>
          <div className="rounded-xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
            {wonLoads.map((load) => (
              <div
                key={load.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--muted)]/20"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs font-semibold text-[var(--primary)]">
                    {load.loadNumber}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
                    {load.pickupAddress.split(",")[0]} →{" "}
                    {load.dropAddress.split(",")[0]}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Shipper:{" "}
                    {load.shipper.companyName ?? load.shipper.name}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs capitalize text-[var(--muted-foreground)]">
                    {load.materialType.toLowerCase()} · {load.weight} MT
                  </p>
                  {load.deliveredAt && (
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      {formatDateTime(load.deliveredAt)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
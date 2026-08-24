import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BidLeaderboard } from "@/components/bids/bid-leaderboard";
import { LoadStatusTimeline } from "@/components/loads/load-status-timeline";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { RatingForm } from "@/components/loads/rating-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Package, MapPin, AlertTriangle,
  Droplets, Users, Clock, ArrowLeft,
  Star, Shield,
} from "lucide-react";
import {
  formatCurrency,
  formatDateTime,
  formatCountdown,
} from "@/lib/utils";
import { getLoadLeaderboard } from "@/actions/bid.actions";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const load = await prisma.load.findUnique({
    where: { id },
    select: { loadNumber: true },
  });
  return { title: load?.loadNumber ?? "Load Details" };
}

export default async function ShipperLoadDetailPage({
  params,
}: PageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [load, leaderboard] = await Promise.all([
    prisma.load.findUnique({
      where: { id },
      include: {
        shipper: {
          select: { id: true, name: true, companyName: true },
        },
        acceptedBid: {
          include: {
            transporter: {
              select: {
                id: true,
                name: true,
                companyName: true,
                transporterProfile: {
                  select: {
                    rating: true,
                    totalTrips: true,
                    vehicleNumber: true,
                    vehicleType: true,
                  },
                },
              },
            },
          },
        },
        escrowTransaction: {
          select: { amount: true, isReleased: true, heldAt: true },
        },
      },
    }),
    getLoadLeaderboard(id),
  ]);

  if (!load) notFound();

  // Only shipper who owns this load or admin can view
  if (
    load.shipperId !== session.user.id &&
    session.user.role !== "ADMIN"
  ) {
    redirect("/shipper");
  }

  const isClosed = new Date(load.biddingClosesAt) <= new Date();
  const countdown = formatCountdown(load.biddingClosesAt);
  const isUrgent =
    !isClosed &&
    new Date(load.biddingClosesAt).getTime() - Date.now() 
      2 * 60 * 60 * 1000;

  // Check if shipper already rated the transporter for this load
  const isDelivered = load.status === "DELIVERED";
  const hasAcceptedBid = !!load.acceptedBid;

  return (
    <div className="max-w-screen-lg space-y-5">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs h-7 text-[var(--muted-foreground)] -mb-2"
        nativeButton={false}
        render={<Link href="/shipper/loads"/>}
      >
          <ArrowLeft className="size-3.5" />
          Back to loads
        
      </Button>

      <PageHeader title={load.loadNumber} icon={Package}>
        <LoadStatusBadge status={load.status} />
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left col — Load info ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Route */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="size-4 text-[var(--muted-foreground)]" />
              Route
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="size-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                    Pickup
                  </p>
                  <p className="text-sm font-medium mt-0.5">
                    {load.pickupAddress}
                  </p>
                </div>
              </div>
              <div className="ml-1.5 w-0.5 h-5 bg-[var(--border)]" />
              <div className="flex items-start gap-3">
                <div className="size-2.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                    Drop
                  </p>
                  <p className="text-sm font-medium mt-0.5">
                    {load.dropAddress}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cargo details */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <h3 className="text-sm font-semibold">Cargo Details</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "Material",
                  value: load.materialType.toLowerCase(),
                },
                {
                  label: "Packaging",
                  value: load.packagingType.toLowerCase(),
                },
                { label: "Weight", value: `${load.weight} MT` },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold capitalize">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Flags */}
            <div className="flex flex-wrap gap-2">
              {load.isFragile && (
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 font-medium">
                  <AlertTriangle className="size-3" />
                  Fragile cargo
                </span>
              )}
              {load.isTarpRequired && (
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20 font-medium">
                  <Droplets className="size-3" />
                  Tarp required
                </span>
              )}
              {load.labourRequired && (
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20 font-medium">
                  <Users className="size-3" />
                  Labour required
                </span>
              )}
            </div>

            {load.description && (
              <div className="pt-3 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--muted-foreground)] mb-1">
                  Description
                </p>
                <p className="text-sm">{load.description}</p>
              </div>
            )}
            {load.specialInstructions && (
              <div className="pt-3 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--muted-foreground)] mb-1">
                  Special Instructions
                </p>
                <p className="text-sm">{load.specialInstructions}</p>
              </div>
            )}
          </div>

          {/* Accepted transporter info */}
          {load.acceptedBid && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
              <h3 className="text-sm font-semibold">
                Assigned Transporter
              </h3>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Users className="size-5 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {load.acceptedBid.transporter.companyName ??
                      load.acceptedBid.transporter.name}
                  </p>
                  {load.acceptedBid.transporter.transporterProfile && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      ⭐{" "}
                      {load.acceptedBid.transporter.transporterProfile.rating.toFixed(
                        1
                      )}{" "}
                      ·{" "}
                      {
                        load.acceptedBid.transporter.transporterProfile
                          .totalTrips
                      }{" "}
                      trips
                      {load.acceptedBid.transporter.transporterProfile
                        .vehicleNumber && (
                        <> · {load.acceptedBid.transporter.transporterProfile.vehicleNumber}</>
                      )}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(load.acceptedBid.amount)}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Winning bid
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ✅ Rating form — only show after delivery */}
          {isDelivered && hasAcceptedBid && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Star className="size-4 text-amber-500" />
                Rate Your Transporter
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Share your experience with{" "}
                {load.acceptedBid!.transporter.companyName ??
                  load.acceptedBid!.transporter.name}
              </p>
              <RatingForm
                loadId={load.id}
                transporterId={load.acceptedBid!.transporter.id}
                transporterName={
                  load.acceptedBid!.transporter.companyName ??
                  load.acceptedBid!.transporter.name ??
                  "Transporter"
                }
              />
            </div>
          )}

          {/* Load Timeline */}
          <LoadStatusTimeline
            currentStatus={load.status}
            createdAt={load.createdAt}
            inTransitAt={load.inTransitAt}
            deliveredAt={load.deliveredAt}
            loadId={load.id}
            isShipper={load.shipperId === session.user.id}
          />
        </div>

        {/* ── Right col — Bidding + Escrow ── */}
        <div className="space-y-4">
          {/* Bidding window */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="size-4 text-[var(--muted-foreground)]" />
              Bidding Window
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">
                  Closes at
                </span>
                <span className="font-medium">
                  {formatDateTime(load.biddingClosesAt)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">
                  Time left
                </span>
                <span
                  className={cn(
                    "font-medium",
                    isClosed
                      ? "text-red-500"
                      : isUrgent
                      ? "text-amber-500 animate-pulse"
                      : ""
                  )}
                >
                  {isClosed ? "Closed" : countdown}
                </span>
              </div>
              {load.basePrice && (
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted-foreground)]">
                    Base price
                  </span>
                  <span className="font-medium">
                    {formatCurrency(load.basePrice)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ✅ Escrow info */}
          {load.escrowTransaction && (
            <div
              className={cn(
                "rounded-xl border p-4 space-y-2",
                load.escrowTransaction.isReleased
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-amber-500/30 bg-amber-500/5"
              )}
            >
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Shield
                  className={cn(
                    "size-4",
                    load.escrowTransaction.isReleased
                      ? "text-emerald-500"
                      : "text-amber-500"
                  )}
                />
                Escrow{" "}
                {load.escrowTransaction.isReleased ? "Released" : "Held"}
              </h3>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted-foreground)]">
                    Amount
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(load.escrowTransaction.amount)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted-foreground)]">
                    {load.escrowTransaction.isReleased
                      ? "Released"
                      : "Held since"}
                  </span>
                  <span>
                    {formatDateTime(load.escrowTransaction.heldAt)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted-foreground)]">
                    Platform fee (2.5%)
                  </span>
                  <span>
                    {formatCurrency(
                      load.escrowTransaction.amount * 0.025
                    )}
                  </span>
                </div>
              </div>
              {!load.escrowTransaction.isReleased &&
                load.status === "DELIVERED" && (
                  <form
                    action={async () => {
                      "use server";
                      const { releaseEscrow } = await import(
                        "@/actions/wallet.actions"
                      );
                      await releaseEscrow(load.id);
                    }}
                  >
                    <Button
                      type="submit"
                      size="sm"
                      className="w-full mt-2 gap-2"
                    >
                      <Shield className="size-3.5" />
                      Release to Transporter
                    </Button>
                  </form>
                )}
            </div>
          )}

          {/* Live Leaderboard */}
          <BidLeaderboard
            loadId={load.id}
            loadNumber={load.loadNumber}
            loadStatus={load.status}
            shipperId={load.shipperId}
            currentUserId={session.user.id}
            userRole={session.user.role}
            initialLeaderboard={leaderboard.map((b, i) => ({
              rank: b.rank,
              bidId: b.bidId,
              transporterId: b.transporterId,
              transporterName: b.transporterName,
              companyName: b.companyName,
              amount: b.amount,
              rating: b.rating,
              totalTrips: b.totalTrips,
              status:
                i === 0
                  ? ("LEADING" as const)
                  : ("OUTBID" as const),
              submittedAt: b.submittedAt,
            }))}
            initialTotalBids={leaderboard.length}
          />
        </div>
      </div>
    </div>
  );
}
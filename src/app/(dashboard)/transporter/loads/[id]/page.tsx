import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BidLeaderboard } from "@/components/bids/bid-leaderboard";
import { BidForm } from "@/components/bids/bid-form";
import { PodForm } from "@/components/loads/pod-form";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Package, MapPin, AlertTriangle,
  Droplets, Users, Clock,
  ArrowLeft, Building2, CheckCircle,
} from "lucide-react";
import {
  formatCurrency,
  formatDateTime,
  formatCountdown,
  cn,
} from "@/lib/utils";
import { getLoadLeaderboard } from "@/actions/bid.actions";
import Link from "next/link";
import type { Metadata, Route } from "next";

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

export default async function TransporterLoadDetailPage({
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
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
        acceptedBid: {
          select: {
            transporterId: true,
            amount: true,
          },
        },
      },
    }),
    getLoadLeaderboard(id),
  ]);

  if (!load) notFound();

  // Only show OPEN or assigned loads
  if (
    load.status === "CANCELLED"
  ) {
    redirect("/transporter/loads");
  }

  // Get this transporter's existing bid
  const myBid = await prisma.bid.findUnique({
    where: {
      loadId_transporterId: {
        loadId: id,
        transporterId: session.user.id,
      },
    },
    select: {
      id: true,
      amount: true,
      status: true,
      lastModifiedAt: true,
      note: true,
    },
  });

  const lowestBid = leaderboard[0]?.amount ?? null;
  const isClosed = new Date(load.biddingClosesAt) <= new Date();
  const countdown = formatCountdown(load.biddingClosesAt);
  const isUrgent =
    !isClosed &&
    new Date(load.biddingClosesAt).getTime() - Date.now() 
      2 * 60 * 60 * 1000;

  // Is this load assigned to this transporter?
  const isMyLoad =
    load.acceptedBid?.transporterId === session.user.id;

  // Show PoD form if load is assigned to this transporter
  // and status is BIDDING_CLOSED, IN_TRANSIT, or ARRIVED
  const showPodForm =
    isMyLoad &&
    ["BIDDING_CLOSED", "IN_TRANSIT", "ARRIVED"].includes(load.status);

  return (
    <div className="max-w-screen-lg space-y-5">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs h-7 text-[var(--muted-foreground)] -mb-2"
        nativeButton={false}
        render={<Link href="/transporter/loads"/>}
      >
          <ArrowLeft className="size-3.5" />
          Back to loads
      </Button>

      <PageHeader title={load.loadNumber} icon={Package}>
        <LoadStatusBadge status={load.status} />
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left — Load Info ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Shipper info */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                <Building2 className="size-4 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {load.shipper.companyName ?? load.shipper.name}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Posted {formatDateTime(load.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Route */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="size-4 text-[var(--muted-foreground)]" />
              Route
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="size-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
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
                <div className="size-2.5 rounded-full bg-red-500 mt-1 shrink-0" />
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

          {/* Cargo */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Package className="size-4 text-[var(--muted-foreground)]" />
              Cargo Details
            </h3>
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

          {/* ✅ Proof of Delivery Form — show for assigned transporter */}
          {showPodForm && (
            <PodForm
              loadId={load.id}
              loadNumber={load.loadNumber}
              currentStatus={load.status}
            />
          )}

          {/* Delivered confirmation */}
          {load.status === "DELIVERED" && isMyLoad && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center space-y-2">
              <CheckCircle className="size-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold text-emerald-600">
                Delivery Completed!
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Payment of{" "}
                <span className="font-semibold">
                  {formatCurrency(
                    (load.acceptedBid?.amount ?? 0) * 0.975
                  )}
                </span>{" "}
                has been released to your wallet.
              </p>
              <Button size="sm" variant="outline" nativeButton={false} render={<Link href={"/transporter/wallet" as Route}/>} className="mt-2">
                View Wallet
              </Button>
            </div>
          )}

          {/* Leaderboard */}
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

        {/* ── Right — Bid Area ── */}
        <div className="space-y-4">
          {/* Bidding window info */}
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
                      ? "text-amber-500 font-semibold animate-pulse"
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
              {lowestBid && (
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted-foreground)]">
                    Lowest bid
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(lowestBid)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bidding tip */}
          {!isClosed && lowestBid && !myBid && (
            <div className="rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/20 px-3 py-2.5">
              <p className="text-xs text-[var(--primary)] font-medium">
                💡 Bid lower than {formatCurrency(lowestBid)} to lead
              </p>
            </div>
          )}

          {/* Bid form — only for open loads */}
          {load.status === "OPEN" && (
            <BidForm
              loadId={load.id}
              loadNumber={load.loadNumber}
              lowestBid={lowestBid}
              biddingClosesAt={load.biddingClosesAt}
              existingBid={
                myBid
                  ? {
                      amount: myBid.amount,
                      lastModifiedAt: myBid.lastModifiedAt,
                    }
                  : null
              }
            />
          )}

          {/* Won load message */}
          {load.status === "BIDDING_CLOSED" && isMyLoad && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
              <p className="text-sm font-semibold text-emerald-600 flex items-center gap-2">
                <CheckCircle className="size-4" />
                You won this load!
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Winning bid:{" "}
                <span className="font-semibold">
                  {formatCurrency(load.acceptedBid?.amount ?? 0)}
                </span>
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Proceed to pickup and use the Proof of Delivery
                section below to confirm delivery.
              </p>
            </div>
          )}

          {/* Not selected */}
          {load.status === "BIDDING_CLOSED" &&
            myBid &&
            myBid.status === "REJECTED" && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4 text-center space-y-2">
                <p className="text-sm font-medium text-[var(--muted-foreground)]">
                  Another transporter was selected
                </p>
                <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/transporter/loads"/>}>
                    Find more loads
                </Button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
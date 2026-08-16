import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BidLeaderboard } from "@/components/bids/bid-leaderboard";
import { LoadStatusTimeline } from "../../../../../components/loads/load-status-timeline";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { acceptBid } from "@/actions/bid.actions";
import { updateLoadStatus } from "@/actions/load.actions";
import {
  Package, MapPin, Weight, Clock,
  AlertTriangle, Droplets, Users,
} from "lucide-react";
import { formatCurrency, formatDateTime, formatCountdown } from "@/lib/utils";
import { getLoadLeaderboard } from "@/actions/bid.actions";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const load = await prisma.load.findUnique({
    where: { id },
    select: { loadNumber: true },
  });
  return { title: load?.loadNumber ?? "Load Details" };
}

export default async function LoadDetailPage({ params }: PageProps) {
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
              select: { name: true, companyName: true },
            },
          },
        },
      },
    }),
    getLoadLeaderboard(id),
  ]);

  if (!load) notFound();
  if (load.shipperId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/shipper");
  }

  const timeLeft = formatCountdown(load.biddingClosesAt);
  const isClosed = new Date(load.biddingClosesAt) <= new Date();

  return (
    <div className="max-w-screen-lg space-y-6">
      <PageHeader
        title={load.loadNumber}
        icon={Package}
      >
        <LoadStatusBadge status={load.status} />
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Load info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Route card */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="size-4 text-[var(--muted-foreground)]" />
              Route
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="size-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">Pickup</p>
                  <p className="text-sm font-medium">{load.pickupAddress}</p>
                </div>
              </div>
              <div className="ml-1 w-0.5 h-4 bg-[var(--border)]" />
              <div className="flex items-start gap-3">
                <div className="size-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">Drop</p>
                  <p className="text-sm font-medium">{load.dropAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cargo details */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="text-sm font-semibold mb-4">Cargo Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Material", value: load.materialType.toLowerCase(), icon: Package },
                { label: "Packaging", value: load.packagingType.toLowerCase(), icon: Package },
                { label: "Weight", value: `${load.weight} MT`, icon: Weight },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                    {item.label}
                  </p>
                  <p className="text-sm font-medium capitalize">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Flags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {load.isFragile && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <AlertTriangle className="size-3" /> Fragile
                </span>
              )}
              {load.isTarpRequired && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  <Droplets className="size-3" /> Tarp Required
                </span>
              )}
              {load.labourRequired && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-purple-500/10 text-purple-600 border border-purple-500/20">
                  <Users className="size-3" /> Labour Required
                </span>
              )}
            </div>

            {load.description && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--muted-foreground)] mb-1">Description</p>
                <p className="text-sm">{load.description}</p>
              </div>
            )}
          </div>

          {/* Status Timeline */}
          <LoadStatusTimeline
            currentStatus={load.status}
            createdAt={load.createdAt}
            inTransitAt={load.inTransitAt}
            deliveredAt={load.deliveredAt}
            loadId={load.id}
            isShipper={load.shipperId === session.user.id}
          />
        </div>

        {/* Right — Bidding */}
        <div className="space-y-4">
          {/* Bid window info */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="size-4 text-[var(--muted-foreground)]" />
              Bidding Window
            </h3>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">Closes at</span>
                <span className="font-medium">{formatDateTime(load.biddingClosesAt)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">Time left</span>
                <span className={isClosed ? "text-red-500" : "font-medium"}>
                  {isClosed ? "Closed" : timeLeft}
                </span>
              </div>
              {load.basePrice && (
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted-foreground)]">Base price</span>
                  <span className="font-medium">{formatCurrency(load.basePrice)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Live leaderboard */}
          <BidLeaderboard
            loadId={load.id}
            loadNumber={load.loadNumber}
            loadStatus={load.status}
            shipperId={load.shipperId}
            currentUserId={session.user.id}
            userRole={session.user.role}
            initialLeaderboard={leaderboard.map((b) => ({
              rank: b.rank,
              bidId: b.bidId,
              transporterId: b.transporterId,
              transporterName: b.transporterName,
              companyName: b.companyName,
              amount: b.amount,
              status: b.status === "ACTIVE" ? "LEADING" : "OUTBID",
              submittedAt: b.submittedAt,
              rating: b.rating,
              totalTrips: b.totalTrips,
            } as any))}
            initialTotalBids={leaderboard.length}
          />
        </div>
      </div>
    </div>
  );
}
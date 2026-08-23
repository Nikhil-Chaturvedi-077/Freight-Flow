import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  List,
  Plus,
  ArrowRight,
  Clock,
  Package,
  TrendingDown,
} from "lucide-react";
import {
  cn,
  formatCurrency,
  formatCountdown,
  formatRelative,
  formatDateTime,
} from "@/lib/utils";
import { LOAD_STATUS_CONFIG } from "@/lib/constants";
import Link from "next/link";
import type { Metadata, Route } from "next";

export const metadata: Metadata = { title: "My Loads" };
export const experimental_ppr = true;

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const STATUS_TABS = [
  { value: "ALL", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "BIDDING_CLOSED", label: "Assigned" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

async function ShipperLoadsList({
  shipperId,
  statusFilter,
}: {
  shipperId: string;
  statusFilter?: string;
}) {
  const loads = await prisma.load.findMany({
    where: {
      shipperId,
      ...(statusFilter && statusFilter !== "ALL"
        ? { status: statusFilter as any }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { bids: true } },
      bids: {
        where: { status: { in: ["ACTIVE", "ACCEPTED"] } },
        orderBy: { amount: "asc" },
        take: 1,
        select: { amount: true, status: true },
      },
      acceptedBid: {
        include: {
          transporter: {
            select: { name: true, companyName: true },
          },
        },
      },
    },
  });

  if (loads.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={
          statusFilter && statusFilter !== "ALL"
            ? `No ${LOAD_STATUS_CONFIG[statusFilter as keyof typeof LOAD_STATUS_CONFIG]?.label ?? statusFilter} loads`
            : "No loads yet"
        }
        description="Post your first load to start receiving bids"
      >
        <Button size="sm" nativeButton={false} render={<Link href="/shipper/loads/new" />}>
          <Plus className="size-3.5 mr-1.5" />
          Post Load
        </Button>
      </EmptyState>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      {/* Table header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 bg-[var(--muted)]/40 border-b border-[var(--border)]">
        {[
          { label: "Load ID", span: 2 },
          { label: "Route", span: 3 },
          { label: "Cargo", span: 2 },
          { label: "Status", span: 2 },
          { label: "Bids / Best", span: 2 },
          { label: "", span: 1 },
        ].map((h) => (
          <div
            key={h.label}
            className={cn(
              "text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]",
              `col-span-${h.span}`,
            )}
          >
            {h.label}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-[var(--border)]">
        {loads.map((load) => {
          const bestBid = load.bids[0]?.amount ?? null;
          const isOpen = load.status === "OPEN";
          const isClosed = new Date(load.biddingClosesAt) <= new Date();
          const countdown = formatCountdown(load.biddingClosesAt);
          const isUrgent =
            isOpen &&
            !isClosed &&
            new Date(load.biddingClosesAt).getTime() - Date.now();
          2 * 60 * 60 * 1000;

          return (
            <Link
              key={load.id}
              href={`/shipper/loads/${load.id}`}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3.5 hover:bg-[var(--muted)]/20 transition-colors group"
            >
              {/* Load ID */}
              <div className="md:col-span-2">
                <p className="font-mono text-xs font-semibold text-[var(--primary)]">
                  {load.loadNumber}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                  {formatRelative(load.createdAt)}
                </p>
              </div>

              {/* Route */}
              <div className="md:col-span-3">
                <p className="text-xs font-medium">
                  {load.pickupAddress.split(",")[0]}
                </p>
                <div className="flex items-center gap-1 my-0.5">
                  <div className="h-px w-3 bg-[var(--border)]" />
                  <ArrowRight className="size-2.5 text-[var(--muted-foreground)]" />
                </div>
                <p className="text-xs font-medium">
                  {load.dropAddress.split(",")[0]}
                </p>
              </div>

              {/* Cargo */}
              <div className="md:col-span-2">
                <p className="text-xs font-medium capitalize">
                  {load.materialType.toLowerCase()}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                  {load.weight} MT
                </p>
              </div>

              {/* Status */}
              <div className="md:col-span-2 flex flex-col justify-center gap-1">
                <LoadStatusBadge status={load.status} />
                {isOpen && (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-[10px]",
                      isUrgent
                        ? "text-red-500 font-medium"
                        : "text-[var(--muted-foreground)]",
                    )}
                  >
                    <Clock className="size-2.5" />
                    {isClosed ? "Closed" : countdown}
                  </div>
                )}
                {load.acceptedBid && (
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    {load.acceptedBid.transporter.companyName ??
                      load.acceptedBid.transporter.name}
                  </p>
                )}
              </div>

              {/* Bids */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="size-3 text-[var(--muted-foreground)]" />
                  <span className="text-xs font-medium">
                    {load._count.bids} bid
                    {load._count.bids !== 1 ? "s" : ""}
                  </span>
                </div>
                {bestBid && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    Best: {formatCurrency(bestBid)}
                  </p>
                )}
              </div>

              {/* Arrow */}
              <div className="md:col-span-1 flex items-center justify-end">
                <ArrowRight className="size-4 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default async function ShipperLoadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const activeStatus = params.status ?? "ALL";

  return (
    <div className="space-y-5 max-w-screen-xl">
      <PageHeader
        title="My Loads"
        description="Manage all your posted loads"
        icon={List}
      >
        <Button size="sm" nativeButton={false} render={<Link href="/shipper/loads/new" />}>
          <Plus className="size-3.5 mr-1.5" />
          Post Load
        </Button>
      </PageHeader>

      {/* Status tabs */}
      <div className="flex items-center gap-0 border-b border-[var(--border)] overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={
              (tab.value === "ALL"
                ? "/shipper/loads"
                : `/shipper/loads?status=${tab.value}`) as Route
            }
            className={cn(
              "px-3 py-2.5 text-xs font-medium border-b-2 -mb-px",
              "whitespace-nowrap transition-colors",
              activeStatus === tab.value
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Suspense
        fallback={
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 px-4 py-3.5 border-b border-[var(--border)] last:border-0"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        }
      >
        <ShipperLoadsList
          shipperId={session.user.id}
          statusFilter={activeStatus}
        />
      </Suspense>
    </div>
  );
}

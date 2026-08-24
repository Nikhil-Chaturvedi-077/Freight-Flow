import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ArrowRight } from "lucide-react";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";
import { Route } from "next";

export const metadata: Metadata = { title: "All Loads" };
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

async function AllLoadsList({ statusFilter }: { statusFilter?: string }) {
  const loads = await prisma.load.findMany({
    where:
      statusFilter && statusFilter !== "ALL"
        ? { status: statusFilter as any }
        : {},
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      shipper: {
        select: { name: true, companyName: true },
      },
      _count: { select: { bids: true } },
      acceptedBid: {
        include: {
          transporter: {
            select: { name: true, companyName: true },
          },
        },
      },
      escrowTransaction: {
        select: { amount: true, isReleased: true },
      },
    },
  });

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 bg-[var(--muted)]/40 border-b border-[var(--border)]">
        {[
          { label: "Load", span: 2 },
          { label: "Shipper", span: 2 },
          { label: "Route", span: 3 },
          { label: "Status", span: 2 },
          { label: "Escrow", span: 2 },
          { label: "", span: 1 },
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
        {loads.map((load) => (
          <div
            key={load.id}
            className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3.5 hover:bg-[var(--muted)]/20 transition-colors"
          >
            <div className="md:col-span-2">
              <p className="font-mono text-xs font-semibold text-[var(--primary)]">
                {load.loadNumber}
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 capitalize">
                {load.materialType.toLowerCase()} · {load.weight} MT
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-medium">
                {load.shipper.companyName ?? load.shipper.name}
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                {load._count.bids} bids
              </p>
            </div>

            <div className="md:col-span-3">
              <p className="text-xs truncate">
                {load.pickupAddress.split(",")[0]}
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)]">
                → {load.dropAddress.split(",")[0]}
              </p>
            </div>

            <div className="md:col-span-2">
              <LoadStatusBadge status={load.status} />
              {load.acceptedBid && (
                <p className="text-[10px] text-[var(--muted-foreground)] mt-1 truncate">
                  {load.acceptedBid.transporter.companyName ??
                    load.acceptedBid.transporter.name}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              {load.escrowTransaction ? (
                <div>
                  <p className="text-xs font-medium">
                    {formatCurrency(load.escrowTransaction.amount)}
                  </p>
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      load.escrowTransaction.isReleased
                        ? "text-emerald-600"
                        : "text-amber-600"
                    )}
                  >
                    {load.escrowTransaction.isReleased
                      ? "Released"
                      : "Held"}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  No escrow
                </span>
              )}
            </div>

            <div className="md:col-span-1 flex items-center justify-end">
              <ArrowRight className="size-4 text-[var(--muted-foreground)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AdminLoadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/shipper");

  const activeStatus = params.status ?? "ALL";

  const totalLoads = await prisma.load.count();

  return (
    <div className="space-y-5 max-w-screen-xl">
      <PageHeader
        title="All Loads"
        description={`${totalLoads} total loads on the platform`}
        icon={Package}
      />

      <div className="flex items-center gap-0 border-b border-[var(--border)] overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={
              (tab.value === "ALL"
                ? "/admin/loads"
                : `/admin/loads?status=${tab.value}`) as Route
            }
            className={cn(
              "px-3 py-2.5 text-xs font-medium border-b-2 -mb-px",
              "whitespace-nowrap transition-colors",
              activeStatus === tab.value
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Suspense
        fallback={
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 px-4 py-3.5 border-b border-[var(--border)] last:border-0"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        }
      >
        <AllLoadsList statusFilter={activeStatus} />
      </Suspense>
    </div>
  );
}
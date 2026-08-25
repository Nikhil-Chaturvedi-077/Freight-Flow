import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Package,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn, formatCurrency, formatRelative } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disputes",
};

type DisputeType =
  | "STUCK_IN_TRANSIT"
  | "BIDDING_CLOSED_NO_ASSIGNMENT"
  | "ESCROW_HELD_TOO_LONG"
  | "CANCELLED_WITH_BIDS";

type Severity = "HIGH" | "MEDIUM" | "LOW";

interface Dispute {
  id: string;
  type: DisputeType;
  severity: Severity;
  loadId: string;
  loadNumber: string;
  description: string;
  createdAt: Date;
  amount?: number;
}

interface DisputeConfig {
  label: string;
  icon: LucideIcon;
  color: string;
}

const DISPUTE_CONFIG: Record<DisputeType, DisputeConfig> = {
  STUCK_IN_TRANSIT: {
    label: "Stuck in Transit",
    icon: Clock,
    color: "text-red-500",
  },

  BIDDING_CLOSED_NO_ASSIGNMENT: {
    label: "Unassigned After Bidding",
    icon: Package,
    color: "text-amber-500",
  },

  ESCROW_HELD_TOO_LONG: {
    label: "Escrow Overdue",
    icon: Wallet,
    color: "text-red-500",
  },

  CANCELLED_WITH_BIDS: {
    label: "Cancelled With Bids",
    icon: AlertTriangle,
    color: "text-blue-500",
  },
};

const SEVERITY_COLORS: Record<Severity, string> = {
  HIGH: "bg-red-500/10 text-red-600 border-red-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  LOW: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const SEVERITY_BG: Record<Severity, string> = {
  HIGH: "bg-red-500/10",
  MEDIUM: "bg-amber-500/10",
  LOW: "bg-blue-500/10",
};

/**
 * Detect potentially problematic loads.
 *
 * Current checks:
 * 1. IN_TRANSIT for more than 3 days
 * 2. OPEN after bidding deadline with bids still present
 * 3. Escrow unreleased for more than 7 days after delivery
 * 4. CANCELLED loads with bids
 */
async function getDisputes(): Promise<Dispute[]> {
  const now = new Date();

  const threeDaysAgo = new Date(
    now.getTime() - 3 * 24 * 60 * 60 * 1000
  );

  const sevenDaysAgo = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000
  );

  const oneDayAgo = new Date(
    now.getTime() - 24 * 60 * 60 * 1000
  );

  const disputes: Dispute[] = [];

  // ---------------------------------------------------------
  // 1. Loads stuck IN_TRANSIT for more than 3 days
  // ---------------------------------------------------------

  const stuckLoads = await prisma.load.findMany({
    where: {
      status: "IN_TRANSIT",
      inTransitAt: {
        lt: threeDaysAgo,
      },
    },

    select: {
      id: true,
      loadNumber: true,
      inTransitAt: true,

      escrowTransaction: {
        select: {
          amount: true,
        },
      },
    },
  });

  stuckLoads.forEach((load) => {
    disputes.push({
      id: `stuck-${load.id}`,
      type: "STUCK_IN_TRANSIT",
      severity: "HIGH",

      loadId: load.id,
      loadNumber: load.loadNumber,

      description:
        "Load has been in transit for more than 3 days without delivery confirmation.",

      createdAt: load.inTransitAt ?? now,

      amount: load.escrowTransaction?.amount,
    });
  });

  // ---------------------------------------------------------
  // 2. Bidding closed but load is still OPEN
  // ---------------------------------------------------------

  const expiredBiddingLoads = await prisma.load.findMany({
    where: {
      status: "OPEN",

      biddingClosesAt: {
        lt: oneDayAgo,
      },
    },

    include: {
      _count: {
        select: {
          bids: true,
        },
      },
    },
  });

  expiredBiddingLoads.forEach((load) => {
    if (load._count.bids > 0) {
      disputes.push({
        id: `expired-${load.id}`,

        type: "BIDDING_CLOSED_NO_ASSIGNMENT",

        severity: "MEDIUM",

        loadId: load.id,
        loadNumber: load.loadNumber,

        description:
          `Bidding closed ${formatRelative(
            load.biddingClosesAt
          )} with ${load._count.bids} bids, but the shipper has not accepted a bid.`,

        createdAt: load.biddingClosesAt,
      });
    }
  });

  // ---------------------------------------------------------
  // 3. Escrow held for more than 7 days on delivered loads
  // ---------------------------------------------------------

  const longHeldEscrows =
    await prisma.escrowTransaction.findMany({
      where: {
        isReleased: false,

        load: {
          status: "DELIVERED",
        },

        heldAt: {
          lt: sevenDaysAgo,
        },
      },

      include: {
        load: {
          select: {
            id: true,
            loadNumber: true,
            deliveredAt: true,
          },
        },
      },
    });

  longHeldEscrows.forEach((escrow) => {
    disputes.push({
      id: `escrow-${escrow.id}`,

      type: "ESCROW_HELD_TOO_LONG",

      severity: "HIGH",

      loadId: escrow.load.id,
      loadNumber: escrow.load.loadNumber,

      description:
        `Escrow of ${formatCurrency(
          escrow.amount
        )} has been held for more than 7 days on a delivered load.`,

      createdAt: escrow.heldAt,

      amount: escrow.amount,
    });
  });

  // ---------------------------------------------------------
  // 4. Cancelled loads with bids
  // ---------------------------------------------------------

  const cancelledWithBids = await prisma.load.findMany({
    where: {
      status: "CANCELLED",

      createdAt: {
        gte: sevenDaysAgo,
      },
    },

    include: {
      _count: {
        select: {
          bids: true,
        },
      },
    },
  });

  cancelledWithBids.forEach((load) => {
    if (load._count.bids > 0) {
      disputes.push({
        id: `cancelled-${load.id}`,

        type: "CANCELLED_WITH_BIDS",

        severity: "LOW",

        loadId: load.id,
        loadNumber: load.loadNumber,

        description:
          `Load was cancelled with ${load._count.bids} bid${
            load._count.bids === 1 ? "" : "s"
          }. Transporters may need notification.`,

        createdAt: load.createdAt,
      });
    }
  });

  // ---------------------------------------------------------
  // Sort:
  // HIGH -> MEDIUM -> LOW
  // Then newest first
  // ---------------------------------------------------------

  const severityOrder: Record<Severity, number> = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2,
  };

  disputes.sort((a, b) => {
    const severityDifference =
      severityOrder[a.severity] -
      severityOrder[b.severity];

    if (severityDifference !== 0) {
      return severityDifference;
    }

    return (
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
    );
  });

  return disputes;
}

function DisputeCard({
  dispute,
}: {
  dispute: Dispute;
}) {
  const config = DISPUTE_CONFIG[dispute.type];

  const Icon = config.icon;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-start justify-between gap-4">
        {/* Left side */}
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              SEVERITY_BG[dispute.severity]
            )}
          >
            <Icon
              className={cn(
                "size-4",
                config.color
              )}
            />
          </div>

          {/* Information */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[var(--primary)]">
                {dispute.loadNumber}
              </span>

              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium",
                  SEVERITY_COLORS[dispute.severity]
                )}
              >
                {dispute.severity}
              </span>

              <Badge
                variant="outline"
                className="h-4 text-[10px]"
              >
                {config.label}
              </Badge>
            </div>

            <p className="text-xs text-[var(--muted-foreground)]">
              {dispute.description}
            </p>

            <p className="text-[10px] text-[var(--muted-foreground)]">
              Detected{" "}
              {formatRelative(dispute.createdAt)}

              {dispute.amount !== undefined && (
                <>
                  {" "}
                  · Amount:{" "}
                  {formatCurrency(dispute.amount)}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action */}
        <Link
          href={`/admin/loads?loadId=${dispute.loadId}`}
          className="shrink-0"
        >
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
          >
            View Load
            <ArrowRight className="size-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function EmptyDisputes() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] px-6 py-12 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-green-500/10">
        <CheckCircle className="size-6 text-green-500" />
      </div>

      <h3 className="text-sm font-semibold">
        No disputes detected
      </h3>

      <p className="mt-1 max-w-md text-xs text-[var(--muted-foreground)]">
        All loads are progressing normally. The system
        checks for stuck loads, overdue escrows,
        unassigned bids, and cancelled loads with bids.
      </p>
    </div>
  );
}

export default async function AdminDisputesPage() {
  const session = await auth();

  // Not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  // Only ADMIN can access this page
  if (session.user.role !== "ADMIN") {
    redirect("/shipper");
  }

  // Fetch ONCE.
  // The old version fetched this again inside DisputesList.
  const disputes = await getDisputes();

  const highCount = disputes.filter(
    (dispute) => dispute.severity === "HIGH"
  ).length;

  const mediumCount = disputes.filter(
    (dispute) => dispute.severity === "MEDIUM"
  ).length;

  const lowCount = disputes.filter(
    (dispute) => dispute.severity === "LOW"
  ).length;

  return (
    <div className="mx-auto w-full max-w-screen-lg space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Disputes
          </h1>

          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Monitor loads that may require admin attention.
          </p>
        </div>

        <div className="text-xs text-[var(--muted-foreground)]">
          {disputes.length}{" "}
          {disputes.length === 1
            ? "issue"
            : "issues"}{" "}
          detected
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* High */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">
                High Priority
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {highCount}
              </p>
            </div>

            <div className="flex size-9 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="size-4 text-red-500" />
            </div>
          </div>
        </div>

        {/* Medium */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">
                Medium Priority
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {mediumCount}
              </p>
            </div>

            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="size-4 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Low */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">
                Low Priority
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {lowCount}
              </p>
            </div>

            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
              <Package className="size-4 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Disputes */}
      {disputes.length === 0 ? (
        <EmptyDisputes />
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute) => (
            <DisputeCard
              key={dispute.id}
              dispute={dispute}
            />
          ))}
        </div>
      )}
    </div>
  );
}
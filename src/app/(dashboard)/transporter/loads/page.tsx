import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { LoadBoardTable } from "../../../../components/loads/load-board-table";
import { LoadBoardFilters } from"../../../../components/loads/load-board-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { MATERIAL_TYPES } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Find Loads" };
export const experimental_ppr = true;

interface PageProps {
  searchParams: Promise<{
    material?: string;
    minWeight?: string;
    maxWeight?: string;
    sort?: string;
  }>;
}

async function LoadsList({
  transporterId,
  material,
  minWeight,
  maxWeight,
  sort,
}: {
  transporterId: string;
  material?: string;
  minWeight?: string;
  maxWeight?: string;
  sort?: string;
}) {
  // Step 1: Fetch open loads
  const loads = await prisma.load.findMany({
    where: {
      status: "OPEN",
      biddingClosesAt: { gt: new Date() },
      ...(material && material !== "ALL"
        ? { materialType: material as any }
        : {}),
      ...(minWeight ? { weight: { gte: parseFloat(minWeight) } } : {}),
      ...(maxWeight ? { weight: { lte: parseFloat(maxWeight) } } : {}),
    },
    orderBy:
      sort === "weight_desc"
        ? { weight: "desc" }
        : sort === "weight_asc"
        ? { weight: "asc" }
        : sort === "closing_soon"
        ? { biddingClosesAt: "asc" }
        : { createdAt: "desc" },
    include: {
      shipper: {
        select: { id: true, name: true, companyName: true },
      },
      _count: { select: { bids: true } },
      //  Single bids include — get ALL bids for this load
      bids: {
        where: { status: { in: ["ACTIVE", "OUTBID"] } },
        orderBy: { amount: "asc" },
        select: {
          id: true,
          amount: true,
          status: true,
          transporterId: true,
        },
      },
    },
  });

  // Step 2: Process data — extract lowestBid + myBid from single bids array
  const processedLoads = loads.map((load) => {
    const lowestBid = load.bids[0]?.amount ?? null;
    const myBid =
      load.bids.find((b) => b.transporterId === transporterId) ?? null;

    return {
      ...load,
      lowestBid,
      // Only expose my bid data to the component
      bids: myBid
        ? [{ id: myBid.id, amount: myBid.amount, status: myBid.status }]
        : [],
    };
  });

  return (
    <LoadBoardTable
      loads={processedLoads}
      transporterId={transporterId}
    />
  );
}

export default async function TransporterLoadsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const totalOpen = await prisma.load.count({
    where: {
      status: "OPEN",
      biddingClosesAt: { gt: new Date() },
    },
  });

  return (
    <div className="space-y-5 max-w-screen-xl">
      <PageHeader
        title="Find Loads"
        description={`${totalOpen} loads available for bidding`}
        icon={Search}
      />

      {/* Filters */}
      <LoadBoardFilters />

      {/* Load list */}
      <Suspense
        fallback={
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 px-4 py-4 border-b border-[var(--border)] last:border-0"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        }
      >
        <LoadsList
          transporterId={session.user.id}
          material={params.material}
          minWeight={params.minWeight}
          maxWeight={params.maxWeight}
          sort={params.sort}
        />
      </Suspense>
    </div>
  );
}
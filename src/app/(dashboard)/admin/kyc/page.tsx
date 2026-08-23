import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";

import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { AdminKYCTable } from "@/components/admin/admin-kyc-table";

export const metadata: Metadata = { title: "KYC Queue" };

async function KYCQueue() {
  const users = await prisma.user.findMany({
    where: { role: "TRANSPORTER" },
    orderBy: [
      { kycStatus: "asc" }, // PENDING first
      { createdAt: "desc" },
    ],
    include: {
      transporterProfile: true,
      _count: { select: { bids: true } },
    },
  });

  return <AdminKYCTable users={users} />;
}

export default async function AdminKYCPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/shipper");

  const [pending, verified, rejected] = await Promise.all([
    prisma.user.count({
      where: { role: "TRANSPORTER", kycStatus: "PENDING" },
    }),
    prisma.user.count({
      where: { role: "TRANSPORTER", kycStatus: "VERIFIED" },
    }),
    prisma.user.count({
      where: { role: "TRANSPORTER", kycStatus: "REJECTED" },
    }),
  ]);

  return (
    <div className="space-y-5 max-w-screen-xl">
      <PageHeader
        title="KYC Queue"
        description="Review and verify transporter accounts"
        icon={ShieldCheck}
      />

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-amber-500" />
          <span className="text-[var(--muted-foreground)]">Pending</span>
          <span className="font-semibold">{pending}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-emerald-500" />
          <span className="text-[var(--muted-foreground)]">Verified</span>
          <span className="font-semibold">{verified}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-red-500" />
          <span className="text-[var(--muted-foreground)]">Rejected</span>
          <span className="font-semibold">{rejected}</span>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 px-4 py-3.5 border-b border-[var(--border)] last:border-0"
              >
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        }
      >
        <KYCQueue />
      </Suspense>
    </div>
  );
}
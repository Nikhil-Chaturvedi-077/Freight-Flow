import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { AdminSettingsForm } from "@/components/admin/admin-settings-form";
import { Settings, Shield, Users, Package } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Platform Settings" };

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/shipper");

  const [totalUsers, totalLoads, pendingKYC] = await Promise.all([
    prisma.user.count(),
    prisma.load.count(),
    prisma.user.count({ where: { kycStatus: "PENDING" } }),
  ]);

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Platform Settings"
        description="Configure platform-wide settings and limits"
        icon={Settings}
      />

      {/* Platform overview cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Users", value: totalUsers, icon: Users },
          { label: "Total Loads", value: totalLoads, icon: Package },
          { label: "KYC Pending", value: pendingKYC, icon: Shield },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[var(--border)] bg-[var(--metric-bg)] p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                {s.label}
              </p>
              <s.icon className="size-3.5 text-[var(--muted-foreground)]" />
            </div>
            <p className="text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <AdminSettingsForm />
    </div>
  );
}
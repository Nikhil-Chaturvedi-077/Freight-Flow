import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { KYCForm } from "@/components/kyc/kyc-form";
import { FileCheck, CheckCircle, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "KYC & Documents" };

export default async function KYCPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      transporterProfile: true,
    },
  });

  if (!user) redirect("/login");

  const kycConfig = {
    PENDING: {
      icon: Clock,
      label: "KYC Pending Review",
      desc: "Your documents are under review. Usually takes 24-48 hours.",
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      iconColor: "text-amber-500",
    },
    VERIFIED: {
      icon: CheckCircle,
      label: "KYC Verified",
      desc: "Your account is fully verified. You can bid on all loads.",
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      iconColor: "text-emerald-500",
    },
    REJECTED: {
      icon: XCircle,
      label: "KYC Rejected",
      desc: "Your KYC was rejected. Please resubmit with correct information.",
      color: "bg-red-500/10 text-red-600 border-red-500/20",
      iconColor: "text-red-500",
    },
  }[user.kycStatus];

  const StatusIcon = kycConfig.icon;

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="KYC & Documents"
        description="Complete your verification to start bidding"
        icon={FileCheck}
      />

      {/* KYC Status Banner */}
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border p-4",
          kycConfig.color
        )}
      >
        <StatusIcon className={cn("size-5 shrink-0 mt-0.5", kycConfig.iconColor)} />
        <div>
          <p className="text-sm font-semibold">{kycConfig.label}</p>
          <p className="text-xs mt-0.5 opacity-80">{kycConfig.desc}</p>
        </div>
      </div>

      {/* KYC Form */}
      <KYCForm
        initialData={{
          companyName: user.companyName ?? "",
          phone: user.phone ?? "",
          gstNumber: user.gstNumber ?? "",
          vehicleNumber:
            user.transporterProfile?.vehicleNumber ?? "",
          vehicleType: user.transporterProfile?.vehicleType ?? "",
          capacity: user.transporterProfile?.capacity ?? undefined,
        }}
      />
    </div>
  );
}
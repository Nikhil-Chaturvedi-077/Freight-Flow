import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { TransporterSettingsForm } from "@/components/settings/transporter-settings-form";
import { Settings } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function TransporterSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      companyName: true,
      gstNumber: true,
    },
  });

  const profile = await prisma.transporterProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      vehicleNumber: true,
      vehicleType: true,
      capacity: true,
      isAvailable: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader
        title="Settings"
        description="Manage your account and vehicle details"
        icon={Settings}
      />
      <TransporterSettingsForm
        initialUser={user}
        initialProfile={profile}
      />
    </div>
  );
}
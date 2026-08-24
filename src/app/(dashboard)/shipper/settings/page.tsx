import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { Settings } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function ShipperSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true, email: true, phone: true,
      companyName: true, gstNumber: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
        icon={Settings}
      />
      <ProfileSettingsForm initialData={user} />
    </div>
  );
}
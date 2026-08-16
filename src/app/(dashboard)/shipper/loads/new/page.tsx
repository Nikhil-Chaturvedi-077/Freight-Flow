import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LoadPostingForm } from "@/components/loads/load-posting-form";
import { PackagePlus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Post New Load" };

export default async function NewLoadPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SHIPPER") redirect("/shipper");

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Post a Load"
        description="Fill in cargo details and set the bidding window"
        icon={PackagePlus}
      />
      <LoadPostingForm />
    </div>
  );
}
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RoleSelectForm } from "@/components/auth/role-select-form";
import { Truck, Package } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Choose your role" };

export default async function RoleSelectPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");

  // Already has role → go to dashboard
  if (session.user.role) {
    redirect(
      session.user.role === "SHIPPER"
        ? "/shipper"
        : session.user.role === "TRANSPORTER"
        ? "/transporter"
        : "/admin"
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Welcome, {session.user.name?.split(" ")[0]}!
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          How will you use Freight-Flow?
        </p>
      </div>

      <RoleSelectForm userName={session.user.name ?? ""} />
    </div>
  );
}
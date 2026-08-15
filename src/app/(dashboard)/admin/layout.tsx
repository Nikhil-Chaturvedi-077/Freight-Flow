import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { AdminSidebar } from "./_components/admin-sidebar";
import { AdminTopbar } from "./_components/admin-topbar";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/login");

  const [kycPendingCount, disputeCount] = await Promise.all([
    prisma.user.count({ where: { kycStatus: "PENDING" } }),
    // Disputes model not yet added — placeholder
    Promise.resolve(0),
  ]);

  return (
    <SidebarShell>
      <AdminSidebar
        session={session}
        kycPendingCount={kycPendingCount}
        disputeCount={disputeCount}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </SidebarShell>
  );
}
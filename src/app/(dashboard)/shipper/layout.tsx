import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { ShipperSidebar } from "./_component/shipper-sidebar";
import { ShipperTopbar } from "./_component/shipper-topbar";
import { SocketProvider } from "@/components/providers/socket-provider";
import { prisma } from "@/lib/prisma";

export default async function ShipperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SHIPPER") redirect("/login");

  const liveBidCount = await prisma.bid.count({
    where: {
      load: { shipperId: session.user.id },
      status: "ACTIVE",
    },
  });

  return (
    <SocketProvider userId={session.user.id}>
      <SidebarShell>
        <ShipperSidebar session={session} liveBidCount={liveBidCount} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <ShipperTopbar />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </SidebarShell>
    </SocketProvider>
  );
}
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { TransporterSidebar } from "./_components/transporter-sidebar";
import { TransporterTopbar } from "./_components/transporter-topbar";
import { SocketProvider } from "@/components/providers/socket-provider";
import { prisma } from "@/lib/prisma";

export default async function TransporterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "TRANSPORTER") redirect("/login");

  const activeBidCount = await prisma.bid.count({
    where: {
      transporterId: session.user.id,
      status: "ACTIVE",
    },
  });

  return (
    <SocketProvider userId={session.user.id}>
    <SidebarShell>
      <TransporterSidebar session={session} activeBidCount={activeBidCount} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TransporterTopbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </SidebarShell>
    </SocketProvider>
  );
}
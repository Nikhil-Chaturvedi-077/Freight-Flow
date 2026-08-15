import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// This layout ONLY handles auth check.
// Each role has its own layout with its own sidebar/topbar.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <>{children}</>;
}
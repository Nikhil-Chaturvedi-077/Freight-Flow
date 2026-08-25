// import { Suspense } from "react";
// import { auth } from "@/lib/auth";
// import { redirect } from "next/navigation";
// import { prisma } from "@/lib/prisma";
// import { PageHeader } from "@/components/shared/page-header";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Badge } from "@/components/ui/badge";
// import { Users } from "lucide-react";
// import { cn, formatRelative } from "@/lib/utils";
// import { WORKSPACE_ROLE_CONFIG } from "@/lib/constants";
// import type { Metadata, Route } from "next";
// import Link from "next/link";

// export const metadata: Metadata = { title: "All Users" };
// export const experimental_ppr = true;

// interface PageProps {
//   searchParams: Promise<{ role?: string }>;
// }

// const ROLE_TABS = [
//   { value: "ALL", label: "All Users" },
//   { value: "SHIPPER", label: "Shippers" },
//   { value: "TRANSPORTER", label: "Transporters" },
//   { value: "ADMIN", label: "Admins" },
// ];

// const ROLE_COLORS: Record<string, string> = {
//   SHIPPER: "bg-blue-500/10 text-blue-600 border-blue-500/20",
//   TRANSPORTER: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
//   ADMIN: "bg-amber-500/10 text-amber-600 border-amber-500/20",
// };

// const KYC_COLORS: Record<string, string> = {
//   PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
//   VERIFIED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
//   REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
// };

// async function UsersList({ roleFilter }: { roleFilter?: string }) {
//   const users = await prisma.user.findMany({
//     where:
//       roleFilter && roleFilter !== "ALL"
//         ? { role: roleFilter as any }
//         : {},
//     orderBy: { createdAt: "desc" },
//     take: 50,
//     include: {
//       _count: {
//         select: {
//           loads: true,
//           bids: true,
//         },
//       },
//       transporterProfile: {
//         select: { rating: true, totalTrips: true },
//       },
//     },
//   });

//   return (
//     <div className="rounded-xl border border-[var(--border)] overflow-hidden">
//       <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 bg-[var(--muted)]/40 border-b border-[var(--border)]">
//         {[
//           { label: "User", span: 3 },
//           { label: "Role", span: 2 },
//           { label: "KYC", span: 2 },
//           { label: "Activity", span: 3 },
//           { label: "Joined", span: 2 },
//         ].map((h) => (
//           <div
//             key={h.label}
//             className={cn(
//               "text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]",
//               `col-span-${h.span}`
//             )}
//           >
//             {h.label}
//           </div>
//         ))}
//       </div>

//       <div className="divide-y divide-[var(--border)]">
//         {users.map((user) => (
//           <div
//             key={user.id}
//             className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3.5 hover:bg-[var(--muted)]/20 transition-colors"
//           >
//             {/* User */}
//             <div className="md:col-span-3">
//               <p className="text-sm font-medium">{user.name ?? "—"}</p>
//               <p className="text-xs text-[var(--muted-foreground)]">
//                 {user.email}
//               </p>
//               {user.companyName && (
//                 <p className="text-[10px] text-[var(--muted-foreground)]">
//                   {user.companyName}
//                 </p>
//               )}
//             </div>

//             {/* Role */}
//             <div className="md:col-span-2 flex items-center">
//               <span
//                 className={cn(
//                   "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium",
//                   ROLE_COLORS[user.role]
//                 )}
//               >
//                 {user.role}
//               </span>
//             </div>

//             {/* KYC */}
//             <div className="md:col-span-2 flex items-center">
//               <span
//                 className={cn(
//                   "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium",
//                   KYC_COLORS[user.kycStatus]
//                 )}
//               >
//                 {user.kycStatus}
//               </span>
//             </div>

//             {/* Activity */}
//             <div className="md:col-span-3">
//               {user.role === "SHIPPER" && (
//                 <p className="text-xs text-[var(--muted-foreground)]">
//                   {user._count.loads} loads posted
//                 </p>
//               )}
//               {user.role === "TRANSPORTER" && (
//                 <div>
//                   <p className="text-xs text-[var(--muted-foreground)]">
//                     {user._count.bids} bids placed
//                   </p>
//                   {user.transporterProfile && (
//                     <p className="text-[10px] text-[var(--muted-foreground)]">
//                       ⭐ {user.transporterProfile.rating.toFixed(1)} ·{" "}
//                       {user.transporterProfile.totalTrips} trips
//                     </p>
//                   )}
//                 </div>
//               )}
//             </div>

//             {/* Joined */}
//             <div className="md:col-span-2">
//               <p className="text-xs text-[var(--muted-foreground)]">
//                 {formatRelative(user.createdAt)}
//               </p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default async function AdminUsersPage({ searchParams }: PageProps) {
//   const params = await searchParams;
//   const session = await auth();
//   if (!session?.user) redirect("/login");
//   if (session.user.role !== "ADMIN") redirect("/shipper");

//   const activeRole = params.role ?? "ALL";
//   const totalUsers = await prisma.user.count();

//   return (
//     <div className="space-y-5 max-w-screen-xl">
//       <PageHeader
//         title="All Users"
//         description={`${totalUsers} registered users`}
//         icon={Users}
//       />

//       {/* Role tabs */}
//       <div className="flex items-center gap-0 border-b border-[var(--border)]">
//         {ROLE_TABS.map((tab) => (
//           <Link
//             key={tab.value}
//             href={
//               (tab.value === "ALL"
//                 ? "/admin/users"
//                 : `/admin/users?role=${tab.value}`) as Route
//             }
//             className={cn(
//               "px-3 py-2.5 text-xs font-medium border-b-2 -mb-px",
//               "whitespace-nowrap transition-colors",
//               activeRole === tab.value
//                 ? "border-[var(--primary)] text-[var(--primary)]"
//                 : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
//             )}>
//             {tab.label}
//           </Link>
//         ))}
//       </div>

//       <Suspense
//         fallback={
//           <div className="rounded-xl border border-[var(--border)] overflow-hidden">
//             {Array.from({ length: 8 }).map((_, i) => (
//               <div
//                 key={i}
//                 className="flex gap-4 px-4 py-3.5 border-b border-[var(--border)] last:border-0"
//               >
//                 <div className="flex-1 space-y-1.5">
//                   <Skeleton className="h-3.5 w-32" />
//                   <Skeleton className="h-3 w-40" />
//                 </div>
//                 <Skeleton className="h-5 w-20 rounded-full" />
//                 <Skeleton className="h-5 w-16 rounded-full" />
//                 <Skeleton className="h-3 w-24" />
//               </div>
//             ))}
//           </div>
//         }
//       >
//         <UsersList roleFilter={activeRole} />
//       </Suspense>
//     </div>
//   );
// }

import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";
import type { Metadata, Route } from "next";

export const metadata: Metadata = { title: "All Users" };

export const experimental_ppr = true;

interface PageProps {
  searchParams: Promise<{ role?: string }>;
}

const ROLE_TABS = [
  { value: "ALL", label: "All Users" },
  { value: "SHIPPER", label: "Shippers" },
  { value: "TRANSPORTER", label: "Transporters" },
  { value: "ADMIN", label: "Admins" },
];

const ROLE_COLORS: Record<string, string> = {
  SHIPPER:
    "bg-blue-500/10 text-blue-600 border-blue-500/20",
  TRANSPORTER:
    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  ADMIN:
    "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

const KYC_COLORS: Record<string, string> = {
  PENDING:
    "bg-amber-500/10 text-amber-600 border-amber-500/20",
  VERIFIED:
    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  REJECTED:
    "bg-red-500/10 text-red-500 border-red-500/20",
};

async function UsersList({
  roleFilter,
}: {
  roleFilter?: string;
}) {
  const users = await prisma.user.findMany({
    where:
      roleFilter && roleFilter !== "ALL"
        ? { role: roleFilter as any }
        : {},

    orderBy: {
      createdAt: "desc",
    },

    take: 50,

    include: {
      _count: {
        select: {
          loads: true,
          bids: true,
        },
      },

      transporterProfile: {
        select: {
          rating: true,
          totalTrips: true,
        },
      },
    },
  });

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      {/* Table Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 bg-[var(--muted)]/40 border-b border-[var(--border)]">
        {[
          { label: "User", span: 3 },
          { label: "Role", span: 2 },
          { label: "KYC", span: 2 },
          { label: "Activity", span: 3 },
          { label: "Joined", span: 2 },
        ].map((h) => (
          <div
            key={h.label}
            className={cn(
              "text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]",
              `col-span-${h.span}`
            )}
          >
            {h.label}
          </div>
        ))}
      </div>

      {/* Users */}
      <div className="divide-y divide-[var(--border)]">
        {users.map((user) => (
          <div
            key={user.id}
            className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3.5 hover:bg-[var(--muted)]/20 transition-colors"
          >
            {/* User */}
            <div className="md:col-span-3">
              <p className="text-sm font-medium">
                {user.name ?? "—"}
              </p>

              <p className="text-xs text-[var(--muted-foreground)]">
                {user.email}
              </p>

              {user.companyName && (
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  {user.companyName}
                </p>
              )}
            </div>

            {/* Role */}
            <div className="md:col-span-2 flex items-center">
              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium",
                  ROLE_COLORS[user.role]
                )}
              >
                {user.role}
              </span>
            </div>

            {/* KYC */}
            <div className="md:col-span-2 flex items-center">
              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium",
                  KYC_COLORS[user.kycStatus]
                )}
              >
                {user.kycStatus}
              </span>
            </div>

            {/* Activity */}
            <div className="md:col-span-3">
              {user.role === "SHIPPER" && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  {user._count.loads} loads posted
                </p>
              )}

              {user.role === "TRANSPORTER" && (
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {user._count.bids} bids placed
                  </p>

                  {user.transporterProfile && (
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      ⭐{" "}
                      {user.transporterProfile.rating.toFixed(1)} ·{" "}
                      {user.transporterProfile.totalTrips} trips
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Joined */}
            <div className="md:col-span-2">
              <p className="text-xs text-[var(--muted-foreground)]">
                {formatRelative(user.createdAt)}
              </p>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {users.length === 0 && (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              No users found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function AdminUsersPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const session = await auth();

  // Require login
  if (!session?.user) {
    redirect("/login");
  }

  // Only admin can access this page
  if (session.user.role !== "ADMIN") {
    redirect("/shipper");
  }

  const activeRole = params.role ?? "ALL";

  const totalUsers = await prisma.user.count();

  return (
    <div className="space-y-5 max-w-screen-xl">
      {/* Header */}
      <PageHeader
        title="All Users"
        description={`${totalUsers} registered users`}
        icon={Users}
      />

      {/* Role tabs */}
      <div className="flex items-center gap-0 border-b border-[var(--border)]">
        {ROLE_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={
              (tab.value === "ALL"
                ? "/admin/users"
                : `/admin/users?role=${tab.value}`) as Route
            }
            className={cn(
              "px-3 py-2.5 text-xs font-medium border-b-2 -mb-px",
              "whitespace-nowrap transition-colors",
              activeRole === tab.value
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Users list */}
      <Suspense
        fallback={
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 px-4 py-3.5 border-b border-[var(--border)] last:border-0"
              >
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>

                <Skeleton className="h-5 w-20 rounded-full" />

                <Skeleton className="h-5 w-16 rounded-full" />

                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        }
      >
        <UsersList roleFilter={activeRole} />
      </Suspense>
    </div>
  );
}
// // "use client";

// // import { signOut } from "next-auth/react";
// // import { LogOut, Settings, User, ChevronsUpDown } from "lucide-react";
// // import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// // import {
// //   DropdownMenu,
// //   DropdownMenuContent,
// //   DropdownMenuItem,
// //   DropdownMenuLabel,
// //   DropdownMenuSeparator,
// //   DropdownMenuTrigger,
// // } from "@/components/ui/dropdown-menu";
// // import { cn } from "@/lib/utils";
// // import { AnimatePresence, motion } from "framer-motion";
// // import { useSidebar } from "./sidebar-shell";

// // interface UserMenuProps {
// //   name: string;
// //   email: string;
// //   image?: string | null;
// //   role: string;
// //   companyName?: string;
// // }

// // export function UserMenu({
// //   name,
// //   email,
// //   image,
// //   role,
// //   companyName,
// // }: UserMenuProps) {
// //   const { collapsed } = useSidebar();
// //   const initials = name
// //     ?.split(" ")
// //     .map((n) => n[0])
// //     .join("")
// //     .toUpperCase()
// //     .slice(0, 2);

// //   return (
// //     <DropdownMenu>
// //       <DropdownMenuTrigger
// //         render={
// //           <button
// //             type="button"
// //             className={cn(
// //               "flex items-center gap-2.5 w-full rounded-md px-2 py-2",
// //               "hover:bg-[var(--accent)] transition-colors text-left",
// //               collapsed && "justify-center"
// //             )}
// //           />
// //         }
// //       >
// //         <Avatar className="size-7 shrink-0">
// //           <AvatarImage src={image ?? undefined} alt={name} />
// //           <AvatarFallback className="text-xs bg-[var(--primary)]/10 text-[var(--primary)]">
// //             {initials}
// //           </AvatarFallback>
// //         </Avatar>

// //         <AnimatePresence>
// //           {!collapsed && (
// //             <motion.div
// //               initial={{ opacity: 0, width: 0 }}
// //               animate={{ opacity: 1, width: "auto" }}
// //               exit={{ opacity: 0, width: 0 }}
// //               className="flex-1 min-w-0 overflow-hidden"
// //             >
// //               <p className="text-sm font-medium truncate leading-tight">
// //                 {companyName ?? name}
// //               </p>
// //               <p className="text-[10px] text-[var(--muted-foreground)] truncate capitalize">
// //                 {role.toLowerCase()}
// //               </p>
// //             </motion.div>
// //           )}
// //         </AnimatePresence>

// //         {!collapsed && (
// //           <ChevronsUpDown className="size-3.5 text-[var(--muted-foreground)] shrink-0" />
// //         )}
// //       </DropdownMenuTrigger>

// //       {/* DropdownMenuContent remains same */}
// //     </DropdownMenu>
// //   );
// // }

// "use client";

// import { signOut } from "next-auth/react";
// import { LogOut, Settings, User, ChevronsUpDown } from "lucide-react";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuGroup,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { cn } from "@/lib/utils";
// import { AnimatePresence, motion } from "framer-motion";
// import { useSidebar } from "./sidebar-shell";
// import Link from "next/link";
// import { Route } from "next";

// interface UserMenuProps {
//   name: string;
//   email: string;
//   image?: string | null;
//   role: string;
//   companyName?: string;
// }

// export function UserMenu({
//   name,
//   email,
//   image,
//   role,
//   companyName,
// }: UserMenuProps) {
//   const { collapsed } = useSidebar();

//   const initials = name
//     ?.split(" ")
//     .map((n) => n[0])
//     .join("")
//     .toUpperCase()
//     .slice(0, 2);

//   const handleLogout = async () => {
//     await signOut({
//       callbackUrl: "/login",
//     });
//   };

//   return (
//     <DropdownMenu>
//       {/* User button */}
//       <DropdownMenuTrigger
//         render={
//           <button
//             type="button"
//             className={cn(
//               "flex items-center gap-2.5 w-full rounded-md px-2 py-2",
//               "hover:bg-[var(--accent)] transition-colors text-left",
//               collapsed && "justify-center"
//             )}
//           />
//         }
//       >
//         {/* Avatar */}
//         <Avatar className="size-7 shrink-0">
//           <AvatarImage src={image ?? undefined} alt={name} />

//           <AvatarFallback className="text-xs bg-[var(--primary)]/10 text-[var(--primary)]">
//             {initials}
//           </AvatarFallback>
//         </Avatar>

//         {/* User details */}
//         <AnimatePresence>
//           {!collapsed && (
//             <motion.div
//               initial={{ opacity: 0, width: 0 }}
//               animate={{ opacity: 1, width: "auto" }}
//               exit={{ opacity: 0, width: 0 }}
//               className="flex-1 min-w-0 overflow-hidden"
//             >
//               <p className="text-sm font-medium truncate leading-tight">
//                 {companyName ?? name}
//               </p>

//               <p className="text-[10px] text-[var(--muted-foreground)] truncate capitalize">
//                 {role.toLowerCase()}
//               </p>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Dropdown icon */}
//         {!collapsed && (
//           <ChevronsUpDown className="size-3.5 text-[var(--muted-foreground)] shrink-0" />
//         )}
//       </DropdownMenuTrigger>

//       {/* Dropdown */}
//       <DropdownMenuContent
//         side="top"
//         align={collapsed ? "center" : "start"}
//         className="w-56"
//       >
//         {/* User information */}
//         <DropdownMenuGroup>
//           <DropdownMenuLabel className="font-normal">
//             <div className="flex flex-col space-y-1">
//               <p className="text-sm font-medium leading-none">
//                 {companyName ?? name}
//               </p>

//               <p className="text-xs leading-none text-[var(--muted-foreground)]">
//                 {email}
//               </p>
//             </div>
//           </DropdownMenuLabel>
//         </DropdownMenuGroup>

//         <DropdownMenuSeparator />

//         {/* Logout */}
//         <DropdownMenuItem
//           onClick={handleLogout}
//           className="flex items-center gap-2 cursor-pointer text-red-500 focus:text-red-500"
//         >
//           <LogOut className="size-4" />
//           <span>Logout</span>
//         </DropdownMenuItem>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// }

"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  LogOut,
  Settings,
  User,
  ChevronsUpDown,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useSidebar } from "./sidebar-shell";

interface UserMenuProps {
  name: string;
  email: string;
  image?: string | null;
  role: string;
  companyName?: string | null;
}

export function UserMenu({
  name,
  email,
  image,
  role,
  companyName,
}: UserMenuProps) {
  const { collapsed } = useSidebar();

  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <DropdownMenu>
      {/* User button */}
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex items-center gap-2.5 w-full rounded-md px-2 py-2",
              "hover:bg-[var(--accent)] transition-colors text-left",
              collapsed && "justify-center"
            )}
          />
        }
      >
        <Avatar className="size-7 shrink-0">
          <AvatarImage
            src={image ?? undefined}
            alt={name}
          />

          <AvatarFallback className="text-xs bg-[var(--primary)]/10 text-[var(--primary)]">
            {initials}
          </AvatarFallback>
        </Avatar>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex-1 min-w-0 overflow-hidden"
            >
              <p className="text-sm font-medium truncate leading-tight">
                {companyName ?? name}
              </p>

              <p className="text-[10px] text-[var(--muted-foreground)] truncate capitalize">
                {role.toLowerCase()}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {!collapsed && (
          <ChevronsUpDown className="size-3.5 text-[var(--muted-foreground)] shrink-0" />
        )}
      </DropdownMenuTrigger>

      {/* Dropdown */}
      <DropdownMenuContent
        align="end"
        side="top"
        className="w-56"
      >
        {/* User information */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">
                {companyName ?? name}
              </p>

              <p className="text-xs text-muted-foreground truncate">
                {email}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={() =>
            signOut({
              callbackUrl: "/login",
            })
          }
          className="flex items-center gap-2 cursor-pointer text-red-500 focus:text-red-500"
        >
          <LogOut className="size-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/role-select",
];

export default auth((req: any) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Allow public paths + api routes
  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p) ||
    pathname.startsWith("/api/auth");

  if (isPublic) {
    // Redirect logged-in users away from auth pages
    if (
      session?.user &&
      (pathname === "/login" || pathname === "/register")
    ) {
      // Google user with no role → role selection
      if (!session.user.role) {
        return NextResponse.redirect(new URL("/role-select", req.url));
      }
      return NextResponse.redirect(
        new URL(getDashboardPath(session.user.role), req.url)
      );
    }
    return NextResponse.next();
  }

  // Require auth
  if (!session?.user) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Google user — no role set yet → force role selection
  if (!session.user.role && pathname !== "/role-select") {
    return NextResponse.redirect(new URL("/role-select", req.url));
  }

  // Role-based access guard
  const userRole = session.user.role as string;
  const ROLE_PATHS: Record<string, string> = {
    SHIPPER: "/shipper",
    TRANSPORTER: "/transporter",
    ADMIN: "/admin",
  };

  for (const [role, basePath] of Object.entries(ROLE_PATHS)) {
    if (pathname.startsWith(basePath) && userRole !== role && userRole !== "ADMIN") {
      return NextResponse.redirect(
        new URL(getDashboardPath(userRole), req.url)
      );
    }
  }

  return NextResponse.next();
});

function getDashboardPath(role?: string): string {
  switch (role) {
    case "SHIPPER": return "/shipper";
    case "TRANSPORTER": return "/transporter";
    case "ADMIN": return "/admin";
    default: return "/role-select";
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)).*)",
  ],
};
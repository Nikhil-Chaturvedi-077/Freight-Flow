import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/register"];
const ROLE_ROUTES: Record<string, string[]> = {
  SHIPPER: ["/shipper"],
  TRANSPORTER: ["/transporter"],
  ADMIN: ["/admin"],
};

const { auth } = NextAuth(authConfig);

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Allow public routes
  if (PUBLIC_ROUTES.some((r) => pathname === r)) {
    // Redirect logged-in users away from auth pages
    if (session?.user && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(
        new URL(getDashboardPath(session.user.role), req.url)
      );
    }
    return NextResponse.next();
  }

  // Require auth for all other routes
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access
  const userRole = session.user.role as string;
  for (const [role, paths] of Object.entries(ROLE_ROUTES)) {
    if (paths.some((p) => pathname.startsWith(p)) && userRole !== role) {
      // Redirect to correct dashboard if wrong role
      return NextResponse.redirect(
        new URL(getDashboardPath(userRole), req.url)
      );
    }
  }

  return NextResponse.next();
});

function getDashboardPath(role?: string): string {
  switch (role) {
    case "SHIPPER":
      return "/shipper";
    case "TRANSPORTER":
      return "/transporter";
    case "ADMIN":
      return "/admin";
    default:
      return "/login";
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // User login ke time
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // Session update ke time role update
      if (trigger === "update" && session?.user?.role) {
        token.role = session.user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }

      return session;
    },
  },

  // IMPORTANT:
  // Middleware/Edge ke liye providers empty.
  providers: [],
} satisfies NextAuthConfig;
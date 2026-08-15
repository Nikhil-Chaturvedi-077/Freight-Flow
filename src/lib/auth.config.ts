import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export default {
  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },

    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyName = user.companyName;
      }

      return token;
    },

    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.companyName = token.companyName as
          | string
          | undefined;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
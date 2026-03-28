import type { Adapter } from "next-auth/adapters";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { UserRole } from "@prisma/client";

import { db } from "@/lib/db";
import { getAdminEmails } from "@/lib/env";
import { ensureSystemReady } from "@/server/services/system-service";

const adminEmails = getAdminEmails();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db) as Adapter,
  session: {
    strategy: "database",
  },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) {
        return false;
      }

      await ensureSystemReady();

      const normalizedEmail = user.email.toLowerCase();
      const shouldBeAdmin = adminEmails.has(normalizedEmail);

      await db.user.updateMany({
        where: {
          email: {
            equals: normalizedEmail,
            mode: "insensitive",
          },
        },
        data: {
          email: normalizedEmail,
          googleId: account?.provider === "google" ? account.providerAccountId : undefined,
          role: shouldBeAdmin ? UserRole.ADMIN : UserRole.USER,
        },
      });

      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.googleId = user.googleId ?? undefined;
      }

      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email) {
        return;
      }

      const normalizedEmail = user.email.toLowerCase();

      await db.user.update({
        where: { id: user.id },
        data: {
          email: normalizedEmail,
        },
      });

      if (adminEmails.has(normalizedEmail)) {
        await db.user.update({
          where: { id: user.id },
          data: { role: UserRole.ADMIN },
        });
      }
    },
    async linkAccount({ user, account }) {
      if (account.provider === "google") {
        await db.user.update({
          where: { id: user.id },
          data: { googleId: account.providerAccountId },
        });
      }
    },
  },
});

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "USER" | "ADMIN";
      googleId?: string;
    };
  }

  interface User {
    role: "USER" | "ADMIN";
    googleId?: string | null;
  }
}

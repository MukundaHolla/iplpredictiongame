import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getRoomStateForUser } from "@/server/services/membership-service";

export async function getSessionUserOrNull() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireAuthenticatedUser() {
  const user = await getSessionUserOrNull();

  if (!user?.id) {
    redirect("/login");
  }

  return user;
}

export async function requireMemberUser() {
  const user = await requireAuthenticatedUser();
  const roomState = await getRoomStateForUser(user.id);

  if (!roomState.membership) {
    redirect("/join-room");
  }

  const { user: dbUser, ...rest } = roomState;

  return {
    user,
    dbUser,
    ...rest,
  };
}

export async function requireAdminUser() {
  const context = await requireMemberUser();

  if (context.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return context;
}

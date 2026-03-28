import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getPreferredRoomRedirectPath, getRoomContextForUser } from "@/server/services/membership-service";

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

export async function requireGlobalAdminUser() {
  const user = await requireAuthenticatedUser();

  if (user.role !== "ADMIN") {
    const destination = await getPreferredRoomRedirectPath(user.id);
    redirect(destination);
  }

  return user;
}

export async function requireRoomMemberUser(roomSlug: string) {
  const user = await requireAuthenticatedUser();
  const roomState = await getRoomContextForUser(user.id, roomSlug);

  if (!roomState.membership) {
    redirect("/rooms");
  }

  const { user: dbUser, ...rest } = roomState;

  return {
    user,
    dbUser,
    ...rest,
  };
}

export async function requireRoomAdminUser(roomSlug: string) {
  const user = await requireGlobalAdminUser();
  const roomState = await getRoomContextForUser(user.id, roomSlug);

  const { user: dbUser, ...rest } = roomState;

  return {
    user,
    dbUser,
    ...rest,
  };
}

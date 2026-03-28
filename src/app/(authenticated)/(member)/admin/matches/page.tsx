import { redirect } from "next/navigation";

import { requireGlobalAdminUser } from "@/lib/access";
import { getRoomStateForUser } from "@/server/services/membership-service";
import { getRoomAdminMatchesPath } from "@/lib/rooms";

export default async function AdminMatchesPage() {
  const user = await requireGlobalAdminUser();
  const roomState = await getRoomStateForUser(user.id);

  redirect(roomState.room ? getRoomAdminMatchesPath(roomState.room.slug) : "/admin");
}

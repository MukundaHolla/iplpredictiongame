import { redirect } from "next/navigation";

import { requireGlobalAdminUser } from "@/lib/access";
import { getRoomAdminResultsPath } from "@/lib/rooms";
import { getRoomStateForUser } from "@/server/services/membership-service";

export default async function AdminResultsPage() {
  const user = await requireGlobalAdminUser();
  const roomState = await getRoomStateForUser(user.id);

  redirect(roomState.room ? getRoomAdminResultsPath(roomState.room.slug) : "/admin");
}

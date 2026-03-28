import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/access";
import { getPreferredRoomRedirectPath } from "@/server/services/membership-service";

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();
  const destination = await getPreferredRoomRedirectPath(user.id);

  redirect(destination);
}

import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/access";
import { getPreferredRoomRedirectPath } from "@/server/services/membership-service";

export default async function MatchesPage() {
  const user = await requireAuthenticatedUser();
  const destination = (await getPreferredRoomRedirectPath(user.id)).replace(
    "/dashboard",
    "/matches",
  );

  redirect(destination);
}

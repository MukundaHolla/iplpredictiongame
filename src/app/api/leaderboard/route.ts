import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getLeaderboardView } from "@/server/services/query-service";
import { getRoomStateForUser } from "@/server/services/membership-service";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roomState = await getRoomStateForUser(session.user.id);

  if (!roomState.membership) {
    return NextResponse.json({ error: "Join the private room first." }, { status: 403 });
  }

  const data = await getLeaderboardView();
  return NextResponse.json(data);
}

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getLeaderboardView } from "@/server/services/query-service";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roomSlug = new URL(request.url).searchParams.get("roomSlug");

  if (!roomSlug) {
    return NextResponse.json({ error: "roomSlug is required." }, { status: 400 });
  }

  const data = await getLeaderboardView(session.user.id, roomSlug);
  return NextResponse.json(data);
}

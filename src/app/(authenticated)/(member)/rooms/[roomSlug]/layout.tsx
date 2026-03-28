import { AppShell } from "@/components/layout/app-shell";
import { requireRoomMemberUser } from "@/lib/access";
import { getLeaderboardPositionForUser } from "@/server/services/leaderboard-service";
import { getRoomsHomeView } from "@/server/services/query-service";

export default async function RoomMemberLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  const roomSlug = (await params)?.roomSlug;

  if (typeof roomSlug !== "string") {
    throw new Error("Room slug is missing.");
  }

  const { user, room } = await requireRoomMemberUser(roomSlug);
  const [rank, roomsHome] = await Promise.all([
    getLeaderboardPositionForUser(user.id, room.id),
    getRoomsHomeView(user.id),
  ]);

  const currentRoom =
    roomsHome.rooms.find((joinedRoom) => joinedRoom.slug === roomSlug) ??
    roomsHome.rooms[0];

  if (!currentRoom) {
    throw new Error("Current room could not be loaded.");
  }

  return (
    <AppShell user={user} currentRoom={currentRoom} joinedRooms={roomsHome.rooms} rank={rank}>
      {children}
    </AppShell>
  );
}

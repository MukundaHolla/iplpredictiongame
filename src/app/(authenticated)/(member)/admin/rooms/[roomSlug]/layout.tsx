import { AppShell } from "@/components/layout/app-shell";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { LoadingLink } from "@/components/navigation/loading-link";
import { Button } from "@/components/ui/button";
import { requireRoomAdminUser } from "@/lib/access";
import { getRoomDashboardPath } from "@/lib/rooms";
import { getLeaderboardPositionForUser } from "@/server/services/leaderboard-service";
import { getRoomsHomeView } from "@/server/services/query-service";

export default async function RoomAdminLayout({
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

  const { user, room } = await requireRoomAdminUser(roomSlug);
  const [rank, roomsHome] = await Promise.all([
    getLeaderboardPositionForUser(user.id, room.id),
    getRoomsHomeView(user.id),
  ]);

  const currentRoom =
    roomsHome.rooms.find((joinedRoom) => joinedRoom.slug === roomSlug) ??
    roomsHome.rooms[0];

  if (!currentRoom) {
    throw new Error("Current admin room could not be loaded.");
  }

  return (
    <AppShell user={user} currentRoom={currentRoom} joinedRooms={roomsHome.rooms} rank={rank}>
      <div className="space-y-8 pb-24 lg:pb-8">
        <div className="hero-panel p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-heading text-sm uppercase tracking-[0.35em] text-blue-600">
                Room Admin
              </p>
              <h1 className="mt-2 font-heading text-4xl text-slate-900 sm:text-5xl">
                {room.name}
              </h1>
              <p className="mt-3 max-w-3xl text-base text-slate-600 sm:text-lg">
                Manage this room&apos;s code, invite list, and room leaderboard while keeping the season fixtures in sync.
              </p>
            </div>

            <Button
              asChild
              variant="outline"
              className="h-12 rounded-2xl border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <LoadingLink
                href={getRoomDashboardPath(roomSlug)}
                message="Going back to the dashboard"
              >
                Back to dashboard
              </LoadingLink>
            </Button>
          </div>
          <AdminTabs roomSlug={roomSlug} />
        </div>
        {children}
      </div>
    </AppShell>
  );
}

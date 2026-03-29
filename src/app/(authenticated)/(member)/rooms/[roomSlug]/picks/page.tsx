import { EmptyState } from "@/components/empty-state";
import { RoomPicksPanel } from "@/components/room-picks-panel";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { requireRoomMemberUser } from "@/lib/access";
import { formatMatchDateTime } from "@/lib/time";
import { getTodayRoomPicksView } from "@/server/services/query-service";

export default async function RoomPicksPage({
  params,
}: {
  params: Promise<{ roomSlug: string }>;
}) {
  const { roomSlug } = await params;
  const { user } = await requireRoomMemberUser(roomSlug);
  const roomPicks = await getTodayRoomPicksView(user.id, roomSlug);

  return (
    <div className="space-y-8 pb-24 lg:pb-8">
      <SectionHeader
        eyebrow="Room picks"
        title="Room picks"
        description="Today’s matches only. See what everyone in this room has picked before the cutoff."
      />

      {roomPicks.matches.length > 0 ? (
        <div className="grid gap-5">
          {roomPicks.matches.map((match) => {
            const start = formatMatchDateTime(new Date(match.startTimeUtc));

            return (
              <section key={match.id} className="surface-card space-y-4 p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full border border-blue-100 bg-blue-50 text-blue-700">
                        {match.matchNumber ? `Match ${match.matchNumber}` : "Today"}
                      </Badge>
                      <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                        {roomPicks.room.name}
                      </Badge>
                    </div>
                    <h2 className="font-heading text-2xl text-slate-900">
                      {match.teamA.shortCode} vs {match.teamB.shortCode}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {start.date} · {start.time}
                      {match.city ? ` · ${match.city}` : ""}
                      {match.venue ? ` · ${match.venue}` : ""}
                    </p>
                  </div>

                  <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                    {match.predictionAvailabilityLabel}
                  </Badge>
                </div>

                <RoomPicksPanel match={match} />
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No visible room picks today"
          description="Come back when a fixture is being played today and the room can compare selections."
        />
      )}
    </div>
  );
}

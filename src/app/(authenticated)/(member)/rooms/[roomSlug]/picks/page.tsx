import { EmptyState } from "@/components/empty-state";
import { RoomPicksPanel } from "@/components/room-picks-panel";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { requireRoomMemberUser } from "@/lib/access";
import { formatMatchDateTime } from "@/lib/time";
import type { MatchCardView } from "@/lib/types";
import { getRoomPicksView } from "@/server/services/query-service";

function RoomPicksMatchSection({
  roomName,
  match,
  defaultOpen = false,
}: {
  roomName: string;
  match: MatchCardView;
  defaultOpen?: boolean;
}) {
  const start = formatMatchDateTime(new Date(match.startTimeUtc));

  return (
    <section className="surface-card space-y-4 p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full border border-blue-100 bg-blue-50 text-blue-700">
              {match.matchNumber ? `Match ${match.matchNumber}` : "Fixture"}
            </Badge>
            <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
              {roomName}
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

      <RoomPicksPanel match={match} collapsible defaultOpen={defaultOpen} />
    </section>
  );
}

export default async function RoomPicksPage({
  params,
}: {
  params: Promise<{ roomSlug: string }>;
}) {
  const { roomSlug } = await params;
  const { user } = await requireRoomMemberUser(roomSlug);
  const roomPicks = await getRoomPicksView(user.id, roomSlug);

  return (
    <div className="space-y-8 pb-24 lg:pb-8">
      <SectionHeader
        eyebrow="Room picks"
        title="Room picks"
        description="Today’s matches stay on top. Earlier matches stay below in collapsed history so you can open any room’s picks when you want them."
      />

      <section className="space-y-5">
        <SectionHeader
          eyebrow="Today"
          title="Today’s room picks"
          description="Matches being played today stay expanded so the room can compare selections quickly."
        />
        {roomPicks.todayMatches.length > 0 ? (
          <div className="grid gap-5">
            {roomPicks.todayMatches.map((match) => (
              <RoomPicksMatchSection
                key={match.id}
                roomName={roomPicks.room.name}
                match={match}
                defaultOpen
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No visible room picks today"
            description="Come back when a fixture is being played today and the room can compare selections."
          />
        )}
      </section>

      <section className="space-y-5">
        <SectionHeader
          eyebrow="Previous"
          title="Previous room picks"
          description="Earlier matches stay collapsed by default so you can open only the ones you want to revisit."
        />
        {roomPicks.pastMatches.length > 0 ? (
          <div className="grid gap-5">
            {roomPicks.pastMatches.map((match) => (
              <RoomPicksMatchSection
                key={match.id}
                roomName={roomPicks.room.name}
                match={match}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No previous room picks yet"
            description="As soon as matches start being played, their room picks history will collect here."
          />
        )}
      </section>
    </div>
  );
}

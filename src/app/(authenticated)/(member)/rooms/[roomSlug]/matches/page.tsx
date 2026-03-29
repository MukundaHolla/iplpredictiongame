import { EmptyState } from "@/components/empty-state";
import { MatchCard } from "@/components/match-card";
import { SectionHeader } from "@/components/section-header";
import { requireRoomMemberUser } from "@/lib/access";
import { getAllMatchesView } from "@/server/services/query-service";

export default async function RoomMatchesPage({
  params,
}: {
  params: Promise<{ roomSlug: string }>;
}) {
  const { roomSlug } = await params;
  const { user } = await requireRoomMemberUser(roomSlug);
  const matches = await getAllMatchesView(user.id, roomSlug);

  const activeMatches = matches.filter(
    (match) =>
      !["COMPLETED", "ABANDONED", "NO_RESULT"].includes(match.status) &&
      !match.isCollapsedFutureFixture,
  );
  const futureMatches = matches.filter((match) => match.isCollapsedFutureFixture);
  const settledMatches = matches.filter((match) =>
    ["COMPLETED", "ABANDONED", "NO_RESULT"].includes(match.status),
  );

  return (
    <div className="space-y-10 pb-24 lg:pb-8">
      <SectionHeader
        eyebrow="Full Schedule"
        title="All IPL 2026 fixtures"
        description="This room keeps its own picks and leaderboard while sharing the same official fixtures and settled match results."
      />

      <section className="space-y-5">
        <SectionHeader
          title="Today, locked, and live"
          description="These are the fixtures you can act on today or follow after the cutoff."
        />
        {activeMatches.length > 0 ? (
          <div className="grid gap-6 2xl:grid-cols-2">
            {activeMatches.map((match, index) => (
              <MatchCard key={match.id} roomSlug={roomSlug} match={match} index={index} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Everything is settled"
            description="There are no open or live fixtures in this room at the moment."
          />
        )}
      </section>

      <section className="space-y-5">
        <SectionHeader
          title="Coming later"
          description="Future fixtures stay visible here and unlock for predictions only on their match day."
        />
        {futureMatches.length > 0 ? (
          <div className="grid gap-4">
            {futureMatches.map((match, index) => (
              <MatchCard key={match.id} roomSlug={roomSlug} match={match} index={index} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No future fixtures waiting"
            description="Every remaining fixture is already in today's window or settled."
          />
        )}
      </section>

      <section className="space-y-5">
        <SectionHeader
          title="Settled results"
          description="Completed, abandoned, and no-result fixtures all stay here for reference."
        />
        {settledMatches.length > 0 ? (
          <div className="grid gap-6 2xl:grid-cols-2">
            {settledMatches.map((match, index) => (
              <MatchCard key={match.id} roomSlug={roomSlug} match={match} index={index} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No settled fixtures yet"
            description="Once admins settle a result, it will appear here together with revealed pick data."
          />
        )}
      </section>
    </div>
  );
}

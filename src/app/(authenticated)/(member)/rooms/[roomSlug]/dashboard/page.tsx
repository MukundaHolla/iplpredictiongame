import { EmptyState } from "@/components/empty-state";
import { MatchCard } from "@/components/match-card";
import { LoadingLink } from "@/components/navigation/loading-link";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { requireRoomMemberUser } from "@/lib/access";
import { getRoomLeaderboardPath } from "@/lib/rooms";
import { getDashboardView } from "@/server/services/query-service";

export default async function RoomDashboardPage({
  params,
}: {
  params: Promise<{ roomSlug: string }>;
}) {
  const { roomSlug } = await params;
  const { user } = await requireRoomMemberUser(roomSlug);
  const dashboard = await getDashboardView(user.id, roomSlug);
  const todayMatches = [...dashboard.today].sort((left, right) => {
    const leftPicked = left.myPredictionTeamId ? 1 : 0;
    const rightPicked = right.myPredictionTeamId ? 1 : 0;

    if (leftPicked !== rightPicked) {
      return leftPicked - rightPicked;
    }

    return new Date(left.startTimeUtc).getTime() - new Date(right.startTimeUtc).getTime();
  });

  return (
    <div className="space-y-8 pb-24 lg:pb-8">
      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px]">
        <div className="surface-card flex flex-col gap-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full border border-blue-100 bg-blue-50 text-blue-700">
              Dashboard
            </Badge>
            <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
              {dashboard.room.name} private room
            </Badge>
            <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
              Reveal {dashboard.revealMode.replaceAll("_", " ")}
            </Badge>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Today&apos;s matches appear first. Picks open on the day of the match and can be
            changed until each cutoff.
          </p>
        </div>

        <LoadingLink
          href={getRoomLeaderboardPath(roomSlug)}
          message="Opening leaderboard"
          className="surface-card interactive-surface flex h-full flex-col justify-between rounded-3xl p-4 sm:p-5"
        >
          <div>
            <p className="font-heading text-xs uppercase tracking-[0.24em] text-blue-600">
              Current Rank
            </p>
            <p className="mt-2 font-heading text-4xl text-slate-900">
              {dashboard.myRank ? `#${dashboard.myRank}` : "—"}
            </p>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Players</p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                You&apos;re competing with {dashboard.room.memberCount}{" "}
                {dashboard.room.memberCount === 1 ? "person" : "people"} in this room
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500">Tap to open the leaderboard</p>
        </LoadingLink>
      </section>

      <section className="space-y-5">
        <SectionHeader
          eyebrow="Today"
          title="Today’s matches"
          description="Open picks show first. Saved picks stay compact here until you want to change them."
        />
        {todayMatches.length > 0 ? (
          <div className="grid gap-6 2xl:grid-cols-2">
            {todayMatches.map((match, index) => (
              <MatchCard
                key={match.id}
                roomSlug={roomSlug}
                match={match}
                index={index}
                compactWhenPicked
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No matches today"
            description="The next prediction window will show up here as soon as a fixture is being played today."
          />
        )}
      </section>

      <section className="space-y-5">
        <SectionHeader
          eyebrow="Upcoming"
          title="Upcoming fixtures"
          description="These stay visible, but predictions open only on the day they are played."
        />
        {dashboard.upcoming.length > 0 ? (
          <div className="grid gap-6 2xl:grid-cols-2">
            {dashboard.upcoming.map((match, index) => (
              <MatchCard key={match.id} roomSlug={roomSlug} match={match} index={index} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing left to pick"
            description="All upcoming fixtures are settled or the schedule has finished."
          />
        )}
      </section>

      <section className="space-y-5">
        <SectionHeader
          eyebrow="Settled"
          title="Latest settled results"
          description="Correct picks are worth one point. Abandoned and no-result matches never count against accuracy."
        />
        {dashboard.settled.length > 0 ? (
          <div className="grid gap-6 2xl:grid-cols-2">
            {dashboard.settled.map((match, index) => (
              <MatchCard key={match.id} roomSlug={roomSlug} match={match} index={index} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No settled matches yet"
            description="As soon as an admin settles the first result, the leaderboard and result cards will show up here."
          />
        )}
      </section>
    </div>
  );
}

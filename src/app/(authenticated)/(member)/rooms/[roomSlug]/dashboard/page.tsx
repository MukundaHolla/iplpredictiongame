import { EmptyState } from "@/components/empty-state";
import { MatchCard } from "@/components/match-card";
import { SectionHeader } from "@/components/section-header";
import { requireRoomMemberUser } from "@/lib/access";
import { getDashboardView } from "@/server/services/query-service";

export default async function RoomDashboardPage({
  params,
}: {
  params: Promise<{ roomSlug: string }>;
}) {
  const { roomSlug } = await params;
  const { user } = await requireRoomMemberUser(roomSlug);
  const dashboard = await getDashboardView(user.id, roomSlug);

  return (
    <div className="space-y-10 pb-24 lg:pb-8">
      <section className="hero-panel p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <p className="font-heading text-sm uppercase tracking-[0.28em] text-blue-600">
              Dashboard
            </p>
            <h1 className="font-heading text-4xl text-slate-900 sm:text-5xl">
              Welcome back, {dashboard.greetingName}
            </h1>
            <p className="max-w-2xl text-lg text-slate-600">
              You&apos;re viewing <span className="font-medium">{dashboard.room.name}</span>. Make
              predictions only on the match day in IST and watch each cutoff carefully.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="surface-card p-5">
              <p className="font-heading text-sm uppercase tracking-[0.24em] text-blue-600">
                Current Rank
              </p>
              <p className="mt-2 font-heading text-5xl text-slate-900">
                {dashboard.myRank ? `#${dashboard.myRank}` : "—"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Updates immediately after each settled result in this room.
              </p>
            </div>
            <div className="surface-card p-5">
              <p className="font-heading text-sm uppercase tracking-[0.24em] text-blue-600">
                Reveal Mode
              </p>
              <p className="mt-2 font-heading text-2xl text-slate-900">
                {dashboard.revealMode.replaceAll("_", " ")}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Aggregate picks appear after lock, and individual picks after settlement.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeader
          eyebrow="Today"
          title="Today’s matches"
          description="Make or revise your picks before each individual cutoff hits."
        />
        {dashboard.today.length > 0 ? (
          <div className="grid gap-6 xl:grid-cols-2">
            {dashboard.today.map((match, index) => (
              <MatchCard key={match.id} roomSlug={roomSlug} match={match} index={index} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No matches today"
            description="The next prediction window will show up here as soon as a fixture falls on today’s IST date."
          />
        )}
      </section>

      <section className="space-y-5">
        <SectionHeader
          eyebrow="Upcoming"
          title="Upcoming fixtures"
          description="These stay visible, but predictions open only when their match day begins in IST."
        />
        {dashboard.upcoming.length > 0 ? (
          <div className="grid gap-6 xl:grid-cols-2">
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
          <div className="grid gap-6 xl:grid-cols-2">
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

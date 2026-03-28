import { EmptyState } from "@/components/empty-state";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { PodiumTop3 } from "@/components/podium-top3";
import { SectionHeader } from "@/components/section-header";
import { requireMemberUser } from "@/lib/access";
import { getLeaderboardView } from "@/server/services/query-service";

export default async function LeaderboardPage() {
  await requireMemberUser();
  const leaderboard = await getLeaderboardView();

  return (
    <div className="space-y-10 pb-24 lg:pb-8">
      <SectionHeader
        eyebrow="Leaderboard"
        title="Room rankings"
        description="Points first, then accuracy, fewer missed picks, and finally the earliest join time."
      />

      {leaderboard.length > 0 ? (
        <>
          <PodiumTop3 entries={leaderboard.slice(0, 3)} />
          <LeaderboardTable entries={leaderboard} />
        </>
      ) : (
        <EmptyState
          title="Leaderboard will appear after the room fills up"
          description="Players need to join the room and at least one result needs to settle before the table becomes meaningful."
        />
      )}
    </div>
  );
}

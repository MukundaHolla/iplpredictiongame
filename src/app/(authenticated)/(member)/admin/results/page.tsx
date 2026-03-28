import { AdminResultsTable } from "@/components/admin/admin-results-table";
import { SectionHeader } from "@/components/section-header";
import { requireAdminUser } from "@/lib/access";
import { getAdminMatchesData } from "@/server/services/admin-service";

export default async function AdminResultsPage() {
  await requireAdminUser();
  const matches = await getAdminMatchesData();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Results"
        title="Settle winners"
        description="Choose the winner for completed matches or mark a fixture as abandoned / no result. Leaderboard updates immediately."
      />
      <AdminResultsTable
        matches={matches.map((match) => ({
          id: match.id,
          matchNumber: match.matchNumber,
          status: match.status,
          winningTeamId: match.winningTeamId,
          startTimeUtc: match.startTimeUtc.toISOString(),
          teamA: {
            id: match.teamA.id,
            shortCode: match.teamA.shortCode,
            name: match.teamA.name,
          },
          teamB: {
            id: match.teamB.id,
            shortCode: match.teamB.shortCode,
            name: match.teamB.name,
          },
        }))}
      />
    </div>
  );
}

import { AdminResultsTable } from "@/components/admin/admin-results-table";
import { SectionHeader } from "@/components/section-header";
import { requireRoomAdminUser } from "@/lib/access";
import { getAdminMatchesData } from "@/server/services/admin-service";

export default async function RoomAdminResultsPage({
  params,
}: {
  params: Promise<{ roomSlug: string }>;
}) {
  const { roomSlug } = await params;
  await requireRoomAdminUser(roomSlug);
  const matches = await getAdminMatchesData(roomSlug);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Results"
        title="Settle winners"
        description="Settling a result updates every room because all rooms share the same official match outcomes."
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

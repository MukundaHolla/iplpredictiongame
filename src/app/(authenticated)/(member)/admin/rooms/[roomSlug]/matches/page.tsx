import { AdminFixtureTable } from "@/components/admin/admin-fixture-table";
import { SectionHeader } from "@/components/section-header";
import { requireRoomAdminUser } from "@/lib/access";
import { getAdminMatchesData } from "@/server/services/admin-service";

export default async function RoomAdminMatchesPage({
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
        eyebrow="Fixtures"
        title="Edit seeded fixtures"
        description="These fixture changes affect every room because the official IPL season schedule is shared globally."
      />
      <AdminFixtureTable
        matches={matches.map((match) => ({
          id: match.id,
          matchNumber: match.matchNumber,
          stage: match.stage,
          startTimeUtc: match.startTimeUtc.toISOString(),
          cutoffTimeUtc: match.cutoffTimeUtc.toISOString(),
          venue: match.venue,
          city: match.city,
          teamA: { shortCode: match.teamA.shortCode, name: match.teamA.name },
          teamB: { shortCode: match.teamB.shortCode, name: match.teamB.name },
        }))}
      />
    </div>
  );
}

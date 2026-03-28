import { AdminFixtureTable } from "@/components/admin/admin-fixture-table";
import { SectionHeader } from "@/components/section-header";
import { requireAdminUser } from "@/lib/access";
import { getAdminMatchesData } from "@/server/services/admin-service";

export default async function AdminMatchesPage() {
  await requireAdminUser();
  const matches = await getAdminMatchesData();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Fixtures"
        title="Edit seeded fixtures"
        description="Change match time, cutoff, venue, city, or stage without touching the database manually."
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

import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/section-header";
import { requireRoomMemberUser } from "@/lib/access";
import { formatMatchDateTime } from "@/lib/time";
import { getHistoryView } from "@/server/services/query-service";

export default async function RoomHistoryPage({
  params,
}: {
  params: Promise<{ roomSlug: string }>;
}) {
  const { roomSlug } = await params;
  const { user } = await requireRoomMemberUser(roomSlug);
  const history = await getHistoryView(user.id, roomSlug);

  return (
    <div className="space-y-8 pb-24 lg:pb-8">
      <SectionHeader
        eyebrow="My Predictions"
        title="Prediction history"
        description="Review every fixture, your pick, the settled winner, and what counted toward your score in this room."
      />

      <div className="grid gap-4">
        {history.map((row) => {
          const start = formatMatchDateTime(new Date(row.startTimeUtc));
          const pickedShortCode =
            row.myPredictionTeamId === row.teamA.id
              ? row.teamA.shortCode
              : row.myPredictionTeamId === row.teamB.id
                ? row.teamB.shortCode
                : "—";
          const winnerShortCode =
            row.winningTeamId === row.teamA.id
              ? row.teamA.shortCode
              : row.winningTeamId === row.teamB.id
                ? row.teamB.shortCode
                : "—";

          return (
            <div
              key={row.matchId}
              className="surface-card flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="space-y-2">
                <p className="font-heading text-2xl text-slate-900">
                  {row.teamA.shortCode} vs {row.teamB.shortCode}
                </p>
                <p className="text-sm text-slate-600">
                  {start.date} · {start.time}
                  {row.city ? ` · ${row.city}` : ""}
                  {row.venue ? ` · ${row.venue}` : ""}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-4 lg:w-[44rem]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">My Pick</p>
                  <p className="mt-1 font-heading text-xl text-slate-900">{pickedShortCode}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Winner</p>
                  <p className="mt-1 font-heading text-xl text-slate-900">{winnerShortCode}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Result</p>
                  <Badge className="mt-2 rounded-full border border-blue-100 bg-blue-50 text-blue-700">
                    {row.resultLabel}
                  </Badge>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Points</p>
                  <p className="mt-1 font-heading text-xl text-slate-900">{row.pointsEarned}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

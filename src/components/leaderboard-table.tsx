import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LeaderboardRowView } from "@/lib/types";

type LeaderboardTableProps = {
  entries: LeaderboardRowView[];
};

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  return (
    <div className="surface-card overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
            <TableHead className="text-slate-500">Rank</TableHead>
            <TableHead className="text-slate-500">Player</TableHead>
            <TableHead className="text-slate-500">Points</TableHead>
            <TableHead className="text-slate-500">Accuracy</TableHead>
            <TableHead className="text-slate-500">Correct</TableHead>
            <TableHead className="text-slate-500">Missed</TableHead>
            <TableHead className="text-slate-500">Streak</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow
              key={entry.userId}
              className="border-slate-200 hover:bg-blue-50/60"
            >
              <TableCell className="font-heading text-lg text-slate-900">#{entry.rank}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 border border-slate-200">
                    <AvatarImage src={entry.image ?? undefined} alt={entry.name} />
                    <AvatarFallback className="bg-blue-50 font-heading text-blue-700">
                      {entry.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-slate-900">{entry.name}</p>
                    <p className="text-xs text-slate-500">
                      {entry.correct + entry.wrong}/{entry.eligibleMatches} picks made
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-slate-900">{entry.points}</TableCell>
              <TableCell className="text-slate-900">
                {Math.round(entry.accuracy * 100)}%
              </TableCell>
              <TableCell className="text-slate-900">{entry.correct}</TableCell>
              <TableCell className="text-slate-900">{entry.missed}</TableCell>
              <TableCell className="text-slate-900">{entry.currentStreak}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

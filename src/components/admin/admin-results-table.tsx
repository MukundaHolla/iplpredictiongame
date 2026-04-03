"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, RotateCcw, Trophy, Umbrella, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { adminSettleMatchAction, adminUnsettleMatchAction } from "@/actions/admin";
import { useAppLoading } from "@/components/providers/app-loading-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMatchDateTime } from "@/lib/time";

type ResultRow = {
  id: string;
  matchNumber: number | null;
  status: "SCHEDULED" | "LOCKED" | "LIVE" | "COMPLETED" | "ABANDONED" | "NO_RESULT";
  winningTeamId: string | null;
  startTimeUtc: string;
  teamA: { id: string; shortCode: string; name: string };
  teamB: { id: string; shortCode: string; name: string };
};

type AdminResultsTableProps = {
  matches: ResultRow[];
};

const actionableStatuses = new Set<ResultRow["status"]>(["SCHEDULED", "LOCKED", "LIVE"]);
const settledStatuses = new Set<ResultRow["status"]>(["COMPLETED", "ABANDONED", "NO_RESULT"]);

function isActionableStatus(status: ResultRow["status"]) {
  return actionableStatuses.has(status);
}

function getCurrentResultLabel(match: ResultRow) {
  const currentWinner =
    match.winningTeamId === match.teamA.id
      ? match.teamA.shortCode
      : match.winningTeamId === match.teamB.id
        ? match.teamB.shortCode
        : null;

  return match.status === "COMPLETED" && currentWinner
    ? `${currentWinner} won`
    : match.status.replaceAll("_", " ");
}

function SettlementButtons({
  match,
  pendingKey,
  isPending,
  onSettle,
  onUnsettle,
  compact = false,
}: {
  match: ResultRow;
  pendingKey: string | null;
  isPending: boolean;
  onSettle: (
    matchId: string,
    status: "COMPLETED" | "ABANDONED" | "NO_RESULT",
    winningTeamId?: string,
  ) => void;
  onUnsettle: (matchId: string) => void;
  compact?: boolean;
}) {
  const wrapperClass = compact
    ? "flex flex-wrap justify-end gap-2"
    : "grid grid-cols-2 gap-2";

  return (
    <div className={wrapperClass}>
      <Button
        type="button"
        variant="secondary"
        onClick={() => onSettle(match.id, "COMPLETED", match.teamA.id)}
        className="rounded-xl border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      >
        {isPending && pendingKey === `${match.id}:COMPLETED:${match.teamA.id}` ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Trophy className="size-4" />
        )}
        {match.teamA.shortCode}
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={() => onSettle(match.id, "COMPLETED", match.teamB.id)}
        className="rounded-xl border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      >
        {isPending && pendingKey === `${match.id}:COMPLETED:${match.teamB.id}` ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Trophy className="size-4" />
        )}
        {match.teamB.shortCode}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onSettle(match.id, "NO_RESULT")}
        className="rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700"
      >
        <Umbrella className="size-4" />
        No Result
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onSettle(match.id, "ABANDONED")}
        className="rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700"
      >
        <XCircle className="size-4" />
        Abandoned
      </Button>
      {settledStatuses.has(match.status) ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => onUnsettle(match.id)}
          className={compact
            ? "rounded-xl text-amber-700 hover:bg-amber-50 hover:text-amber-800"
            : "col-span-2 rounded-xl text-amber-700 hover:bg-amber-50 hover:text-amber-800"}
        >
          {isPending && pendingKey === `${match.id}:unsettle` ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <RotateCcw className="size-4" />
          )}
          Unsettle
        </Button>
      ) : null}
    </div>
  );
}

function FeaturedSettlementCard({
  match,
  pendingKey,
  isPending,
  onSettle,
  onUnsettle,
}: {
  match: ResultRow;
  pendingKey: string | null;
  isPending: boolean;
  onSettle: (
    matchId: string,
    status: "COMPLETED" | "ABANDONED" | "NO_RESULT",
    winningTeamId?: string,
  ) => void;
  onUnsettle: (matchId: string) => void;
}) {
  const start = formatMatchDateTime(new Date(match.startTimeUtc));

  return (
    <section className="surface-card border border-blue-100 bg-blue-50/70 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full border border-blue-200 bg-white text-blue-700">
              Quick settle
            </Badge>
            <Badge className="rounded-full border border-slate-200 bg-white text-slate-700">
              {match.matchNumber ? `Match ${match.matchNumber}` : "Fixture"}
            </Badge>
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-2xl text-slate-900">
              {match.teamA.shortCode} vs {match.teamB.shortCode}
            </h3>
            <p className="text-sm text-slate-600">
              {start.date} · {start.time}
            </p>
            <p className="text-sm font-medium text-slate-700">
              Current status: {getCurrentResultLabel(match)}
            </p>
          </div>
        </div>

        <p className="max-w-sm text-sm leading-6 text-slate-600">
          Today’s or closest unsettled match stays pinned here so you can settle the winner without
          scanning the full list first.
        </p>
      </div>

      <div className="mt-5">
        <SettlementButtons
          match={match}
          pendingKey={pendingKey}
          isPending={isPending}
          onSettle={onSettle}
          onUnsettle={onUnsettle}
        />
      </div>
    </section>
  );
}

export function AdminResultsTable({ matches }: AdminResultsTableProps) {
  const router = useRouter();
  const { beginLoading, endLoading } = useAppLoading();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const featuredMatch = matches.find((match) => isActionableStatus(match.status)) ?? null;
  const remainingMatches = featuredMatch
    ? matches.filter((match) => match.id !== featuredMatch.id)
    : matches;

  const handleSettle = (
    matchId: string,
    status: "COMPLETED" | "ABANDONED" | "NO_RESULT",
    winningTeamId?: string,
  ) => {
    setPendingKey(`${matchId}:${status}:${winningTeamId ?? "none"}`);
    beginLoading("Refreshing the leaderboard");

    startTransition(async () => {
      const result = await adminSettleMatchAction({
        matchId,
        status,
        winningTeamId: winningTeamId ?? null,
      });

      setPendingKey(null);

      if (!result.success) {
        endLoading();
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
      endLoading();
    });
  };

  const handleUnsettle = (matchId: string) => {
    setPendingKey(`${matchId}:unsettle`);
    beginLoading("Resetting the match result");

    startTransition(async () => {
      const result = await adminUnsettleMatchAction(matchId);

      setPendingKey(null);

      if (!result.success) {
        endLoading();
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
      endLoading();
    });
  };

  return (
    <div className="space-y-6">
      {featuredMatch ? (
        <FeaturedSettlementCard
          match={featuredMatch}
          pendingKey={pendingKey}
          isPending={isPending}
          onSettle={handleSettle}
          onUnsettle={handleUnsettle}
        />
      ) : null}

      {remainingMatches.length > 0 ? (
        <>
          <div className="grid gap-4 lg:hidden">
            {remainingMatches.map((match) => {
              const start = formatMatchDateTime(new Date(match.startTimeUtc));

              return (
                <div key={match.id} className="surface-card p-4">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="font-heading text-xl text-slate-900">
                        {match.matchNumber ? `Match #${match.matchNumber}` : "Playoff"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {match.teamA.shortCode} vs {match.teamB.shortCode}
                      </p>
                    </div>

                    <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <div>
                        <p className="font-medium text-slate-900">Start</p>
                        <p>{start.date}</p>
                        <p>{start.time}</p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Current result</p>
                        <p>{getCurrentResultLabel(match)}</p>
                      </div>
                    </div>

                    <SettlementButtons
                      match={match}
                      pendingKey={pendingKey}
                      isPending={isPending}
                      onSettle={handleSettle}
                      onUnsettle={handleUnsettle}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="surface-card hidden overflow-hidden p-0 lg:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-slate-500">Match</TableHead>
                    <TableHead className="text-slate-500">Fixture</TableHead>
                    <TableHead className="text-slate-500">Start</TableHead>
                    <TableHead className="text-slate-500">Current result</TableHead>
                    <TableHead className="text-right text-slate-500">Settlement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {remainingMatches.map((match) => {
                    const start = formatMatchDateTime(new Date(match.startTimeUtc));

                    return (
                      <TableRow key={match.id} className="border-slate-200 hover:bg-blue-50/60">
                        <TableCell className="font-heading text-slate-900">
                          {match.matchNumber ? `#${match.matchNumber}` : "Playoff"}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-slate-900">
                              {match.teamA.shortCode} vs {match.teamB.shortCode}
                            </p>
                            <p className="text-xs text-slate-500">
                              {match.teamA.name} vs {match.teamB.name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {start.date}
                          <span className="ml-2 text-slate-500">{start.time}</span>
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {getCurrentResultLabel(match)}
                        </TableCell>
                        <TableCell>
                          <SettlementButtons
                            match={match}
                            pendingKey={pendingKey}
                            isPending={isPending}
                            onSettle={handleSettle}
                            onUnsettle={handleUnsettle}
                            compact
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

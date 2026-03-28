"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, RotateCcw, Trophy, Umbrella, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  adminSettleMatchAction,
  adminUnsettleMatchAction,
} from "@/actions/admin";
import { useAppLoading } from "@/components/providers/app-loading-provider";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

export function AdminResultsTable({ matches }: AdminResultsTableProps) {
  const router = useRouter();
  const { beginLoading, endLoading } = useAppLoading();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <div className="grid gap-4 lg:hidden">
        {matches.map((match) => {
          const start = formatMatchDateTime(new Date(match.startTimeUtc));
          const currentWinner =
            match.winningTeamId === match.teamA.id
              ? match.teamA.shortCode
              : match.winningTeamId === match.teamB.id
                ? match.teamB.shortCode
                : null;

          const settle = (
            status: "COMPLETED" | "ABANDONED" | "NO_RESULT",
            winningTeamId?: string,
          ) => {
            setPendingKey(`${match.id}:${status}:${winningTeamId ?? "none"}`);
            beginLoading("Refreshing the leaderboard");

            startTransition(async () => {
              const result = await adminSettleMatchAction({
                matchId: match.id,
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

          return (
            <div key={match.id} className="surface-card p-4">
              <div className="space-y-4">
                <div>
                  <p className="font-heading text-xl text-slate-900">
                    {match.matchNumber ? `Match #${match.matchNumber}` : "Playoff"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
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
                    <p>
                      {match.status === "COMPLETED" && currentWinner
                        ? `${currentWinner} won`
                        : match.status.replaceAll("_", " ")}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => settle("COMPLETED", match.teamA.id)}
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
                    onClick={() => settle("COMPLETED", match.teamB.id)}
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
                    onClick={() => settle("NO_RESULT")}
                    className="rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Umbrella className="size-4" />
                    No Result
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => settle("ABANDONED")}
                    className="rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <XCircle className="size-4" />
                    Abandoned
                  </Button>
                  {(match.status === "COMPLETED" ||
                    match.status === "ABANDONED" ||
                    match.status === "NO_RESULT") ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setPendingKey(`${match.id}:unsettle`);
                        beginLoading("Resetting the match result");

                        startTransition(async () => {
                          const result = await adminUnsettleMatchAction(match.id);

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
                      }}
                      className="col-span-2 rounded-xl text-amber-700 hover:bg-amber-50 hover:text-amber-800"
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
          {matches.map((match) => {
            const start = formatMatchDateTime(new Date(match.startTimeUtc));
            const currentWinner =
              match.winningTeamId === match.teamA.id
                ? match.teamA.shortCode
                : match.winningTeamId === match.teamB.id
                  ? match.teamB.shortCode
                  : null;

            const settle = (
              status: "COMPLETED" | "ABANDONED" | "NO_RESULT",
              winningTeamId?: string,
            ) => {
              setPendingKey(`${match.id}:${status}:${winningTeamId ?? "none"}`);
              beginLoading("Refreshing the leaderboard");

              startTransition(async () => {
                const result = await adminSettleMatchAction({
                  matchId: match.id,
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
                  {match.status === "COMPLETED" && currentWinner
                    ? `${currentWinner} won`
                    : match.status.replaceAll("_", " ")}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => settle("COMPLETED", match.teamA.id)}
                      className="rounded-xl border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {isPending &&
                      pendingKey === `${match.id}:COMPLETED:${match.teamA.id}` ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Trophy className="size-4" />
                      )}
                      {match.teamA.shortCode}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => settle("COMPLETED", match.teamB.id)}
                      className="rounded-xl border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {isPending &&
                      pendingKey === `${match.id}:COMPLETED:${match.teamB.id}` ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Trophy className="size-4" />
                      )}
                      {match.teamB.shortCode}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => settle("NO_RESULT")}
                      className="rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Umbrella className="size-4" />
                      No Result
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => settle("ABANDONED")}
                      className="rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <XCircle className="size-4" />
                      Abandoned
                    </Button>
                    {(match.status === "COMPLETED" ||
                      match.status === "ABANDONED" ||
                      match.status === "NO_RESULT") ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setPendingKey(`${match.id}:unsettle`);
                          beginLoading("Resetting the match result");

                          startTransition(async () => {
                            const result = await adminUnsettleMatchAction(match.id);

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
                        }}
                        className="rounded-xl text-amber-700 hover:bg-amber-50 hover:text-amber-800"
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
        </div>
      </div>
    </>
  );
}

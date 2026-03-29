"use client";

import { startTransition, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Lock,
  MapPin,
  TimerReset,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { upsertPredictionAction } from "@/actions/predictions";
import { ConfettiBurst } from "@/components/confetti-burst";
import { CountdownTimer } from "@/components/countdown-timer";
import { RoomPicksPanel } from "@/components/room-picks-panel";
import { TeamBadge } from "@/components/team-badge";
import { useAppLoading } from "@/components/providers/app-loading-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatMatchDateTime } from "@/lib/time";
import type { MatchCardView } from "@/lib/types";
import { cn } from "@/lib/utils";

type MatchCardProps = {
  roomSlug: string;
  match: MatchCardView;
  index?: number;
  compactWhenPicked?: boolean;
};

function getStatusLabel(status: MatchCardView["status"]) {
  switch (status) {
    case "LOCKED":
      return "Locked";
    case "LIVE":
      return "Live";
    case "COMPLETED":
      return "Settled";
    case "ABANDONED":
      return "Abandoned";
    case "NO_RESULT":
      return "No Result";
    default:
      return "Open";
  }
}

function getStatusClass(status: MatchCardView["status"]) {
  switch (status) {
    case "LIVE":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "LOCKED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "COMPLETED":
    case "ABANDONED":
    case "NO_RESULT":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

export function MatchCard({
  roomSlug,
  match,
  index = 0,
  compactWhenPicked = false,
}: MatchCardProps) {
  const router = useRouter();
  const { beginLoading, endLoading } = useAppLoading();
  const { date, time } = formatMatchDateTime(new Date(match.startTimeUtc));
  const pickedTeamShortCode =
    match.myPredictionTeamId === match.teamA.id
      ? match.teamA.shortCode
      : match.myPredictionTeamId === match.teamB.id
        ? match.teamB.shortCode
        : null;
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null);
  const [confettiBurstKey, setConfettiBurstKey] = useState(0);
  const shouldRenderCompactPickedCard =
    compactWhenPicked &&
    Boolean(pickedTeamShortCode) &&
    match.canPredictToday &&
    !match.isLocked &&
    !isExpanded;

  const selectTeam = (teamId: string, teamShortCode: string) => {
    if (!match.canPredictToday || pendingTeamId) {
      return;
    }

    setPendingTeamId(teamId);
    beginLoading("Saving your pick");

    startTransition(async () => {
      const result = await upsertPredictionAction({
        roomSlug,
        matchId: match.id,
        predictedTeamId: teamId,
      });

      setPendingTeamId(null);

      if (!result.success) {
        endLoading();
        toast.error(result.message);
        return;
      }

      setConfettiBurstKey((current) => current + 1);
      toast.success(result.message ?? `${teamShortCode} locked in.`);
      router.refresh();
      endLoading();
    });
  };

  if (match.isCollapsedFutureFixture) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.24, ease: "easeOut" }}
      >
        <Card className="surface-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                  {match.matchNumber ? `Match ${match.matchNumber}` : "Fixture"}
                </Badge>
                <Badge className="rounded-full border border-blue-100 bg-blue-50 text-blue-700">
                  Upcoming
                </Badge>
              </div>
              <p className="font-heading text-xl text-slate-900">
                {match.teamA.shortCode} vs {match.teamB.shortCode}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4 text-blue-600" />
                  {date} · {time}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-blue-600" />
                  {match.city
                    ? `${match.city} · ${match.venue ?? "Venue TBA"}`
                    : match.venue ?? "Venue TBA"}
                </span>
              </div>
              <p className="text-sm font-medium text-blue-700">
                {match.predictionAvailabilityLabel}
              </p>
            </div>
            <div className="hidden rounded-full bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500 sm:flex">
              Read only until match day
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  if (shouldRenderCompactPickedCard) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.28, ease: "easeOut" }}
      >
        <Card className="surface-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border border-blue-100 bg-blue-50 text-blue-700">
                  {match.matchNumber ? `Match ${match.matchNumber}` : "Today"}
                </Badge>
                <Badge className="rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                  Selected {pickedTeamShortCode}
                </Badge>
                <CountdownTimer targetIso={match.cutoffTimeUtc} locked={false} />
              </div>

              <div className="space-y-1">
                <p className="font-heading text-xl text-slate-900">
                  {match.teamA.shortCode} vs {match.teamB.shortCode}
                </p>
                <p className="text-sm text-slate-600">Prediction saved for today.</p>
              </div>

              <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                <span className="glass-chip justify-start">
                  <CalendarDays className="size-4 text-blue-600" />
                  <span>
                    {date}
                    <span className="ml-2 text-slate-500">{time}</span>
                  </span>
                </span>
                <span className="glass-chip justify-start">
                  <TimerReset className="size-4 text-blue-600" />
                  <span>Cutoff {formatMatchDateTime(new Date(match.cutoffTimeUtc)).time}</span>
                </span>
              </div>

              <RoomPicksPanel match={match} collapsible />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setIsExpanded(true)}
              className="w-full rounded-xl border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:w-auto"
            >
              Change pick
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <>
      <ConfettiBurst burstKey={confettiBurstKey} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.28, ease: "easeOut" }}
      >
        <Card className="surface-card overflow-hidden p-0">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-heading text-sm uppercase tracking-[0.24em] text-blue-600">
                  {match.matchNumber ? `Match ${match.matchNumber}` : "League Match"}
                </p>
                <h3 className="font-heading text-2xl text-slate-900">
                  {match.teamA.shortCode} vs {match.teamB.shortCode}
                </h3>
                <p className="text-sm text-slate-500">{match.predictionAvailabilityLabel}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn("rounded-full border px-3 py-1", getStatusClass(match.status))}>
                  {getStatusLabel(match.status)}
                </Badge>
                {pickedTeamShortCode ? (
                  <Badge className="rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                    Selected {pickedTeamShortCode}
                  </Badge>
                ) : null}
                {match.isLocked || match.canPredictToday ? (
                  <CountdownTimer targetIso={match.cutoffTimeUtc} locked={match.isLocked} />
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)]">
              <TeamBadge
                {...match.teamA}
                active={match.myPredictionTeamId === match.teamA.id}
                onClick={() => selectTeam(match.teamA.id, match.teamA.shortCode)}
                disabled={!match.canPredictToday || Boolean(pendingTeamId)}
                loading={pendingTeamId === match.teamA.id}
              />
              <div className="mx-auto flex size-14 items-center justify-center self-center rounded-full bg-slate-100 text-sm font-medium text-slate-500 xl:size-16">
                vs
              </div>
              <TeamBadge
                {...match.teamB}
                active={match.myPredictionTeamId === match.teamB.id}
                onClick={() => selectTeam(match.teamB.id, match.teamB.shortCode)}
                disabled={!match.canPredictToday || Boolean(pendingTeamId)}
                loading={pendingTeamId === match.teamB.id}
              />
            </div>

            <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 2xl:grid-cols-3">
              <div className="glass-chip justify-start">
                <CheckCircle2 className="size-4 text-blue-600" />
                <span>
                  {date}
                  <span className="ml-2 text-slate-500">{time}</span>
                </span>
              </div>
              <div className="glass-chip justify-start">
                <MapPin className="size-4 text-blue-600" />
                <span>
                  {match.city
                    ? `${match.city} · ${match.venue ?? "Venue TBA"}`
                    : match.venue ?? "Venue TBA"}
                </span>
              </div>
              <div className="glass-chip justify-start">
                <TimerReset className="size-4 text-blue-600" />
                <span>Cutoff {formatMatchDateTime(new Date(match.cutoffTimeUtc)).time}</span>
              </div>
            </div>

            <RoomPicksPanel match={match} collapsible />

            <div className="flex items-center justify-between gap-3">
              {!pickedTeamShortCode ? (
                <p className="text-sm font-medium text-slate-700">
                  {match.canPredictToday
                    ? "Tap a team card to choose the winner"
                    : match.predictionAvailabilityLabel}
                </p>
              ) : (
                <p className="text-sm font-medium text-emerald-700">
                  Tap the other team card if you want to change your pick before the cutoff.
                </p>
              )}
              {match.isLocked ? (
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-amber-700">
                  <Lock className="size-3.5" /> Locked
                </span>
              ) : null}
            </div>

            {match.revealAggregate && match.distribution ? (
              <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <p className="font-medium text-slate-900">Pick distribution</p>
                  <p className="text-slate-500">
                    {match.distribution.totalPredictions} submitted
                  </p>
                </div>
                {match.distribution.picks.map((pick) => (
                  <div key={pick.teamId} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-heading text-slate-900">{pick.shortCode}</span>
                      <span className="text-slate-500">
                        {pick.count} pick{pick.count === 1 ? "" : "s"} ·{" "}
                        {Math.round(pick.percentage * 100)}%
                      </span>
                    </div>
                    <Progress value={pick.percentage * 100} className="h-2.5 bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : null}

            {match.winningTeamId ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                Winner:{" "}
                <span className="font-heading">
                  {match.winningTeamId === match.teamA.id ? match.teamA.name : match.teamB.name}
                </span>
              </div>
            ) : null}

          </div>
        </Card>
      </motion.div>
    </>
  );
}

"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Lock,
  MapPin,
  TimerReset,
} from "lucide-react";

import { CountdownTimer } from "@/components/countdown-timer";
import { PredictionSelector } from "@/components/prediction-selector";
import { TeamBadge } from "@/components/team-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatMatchDateTime } from "@/lib/time";
import type { MatchCardView } from "@/lib/types";
import { cn } from "@/lib/utils";

type MatchCardProps = {
  roomSlug: string;
  match: MatchCardView;
  index?: number;
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

export function MatchCard({ roomSlug, match, index = 0 }: MatchCardProps) {
  const { date, time } = formatMatchDateTime(new Date(match.startTimeUtc));
  const pickedTeamShortCode =
    match.myPredictionTeamId === match.teamA.id
      ? match.teamA.shortCode
      : match.myPredictionTeamId === match.teamB.id
        ? match.teamB.shortCode
        : null;

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

  return (
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
              {match.isLocked || match.canPredictToday ? (
                <CountdownTimer targetIso={match.cutoffTimeUtc} locked={match.isLocked} />
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
            <TeamBadge {...match.teamA} active={match.myPredictionTeamId === match.teamA.id} />
            <div className="mx-auto rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-500">
              vs
            </div>
            <TeamBadge {...match.teamB} active={match.myPredictionTeamId === match.teamB.id} />
          </div>

          <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
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

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-700">
                {pickedTeamShortCode
                  ? `Your pick: ${pickedTeamShortCode}`
                  : match.canPredictToday
                    ? "Pick the winner before the cutoff"
                    : match.predictionAvailabilityLabel}
              </p>
              {match.isLocked ? (
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-amber-700">
                  <Lock className="size-3.5" /> Locked
                </span>
              ) : null}
            </div>
            <PredictionSelector
              roomSlug={roomSlug}
              matchId={match.id}
              teamA={match.teamA}
              teamB={match.teamB}
              selectedTeamId={match.myPredictionTeamId}
              disabled={!match.canPredictToday}
            />
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

          {match.revealIndividualPicks && match.individualPicks.length > 0 ? (
            <div className="space-y-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Friends&apos; picks</p>
              <div className="flex flex-wrap gap-2">
                {match.individualPicks.map((pick) => (
                  <span
                    key={`${match.id}-${pick.userId}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600"
                  >
                    {pick.name} · {pick.pickedTeamShortCode}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    </motion.div>
  );
}

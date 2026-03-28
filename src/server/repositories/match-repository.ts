import { MatchStatus, type MatchStage } from "@prisma/client";

import { db } from "@/lib/db";

export const matchRepository = {
  listMatches() {
    return db.match.findMany({
      include: {
        teamA: true,
        teamB: true,
        winningTeam: true,
      },
      orderBy: [{ startTimeUtc: "asc" }, { matchNumber: "asc" }],
    });
  },

  getMatchById(matchId: string) {
    return db.match.findUnique({
      where: { id: matchId },
      include: {
        teamA: true,
        teamB: true,
        winningTeam: true,
      },
    });
  },

  async upsertTeam(input: {
    shortCode: string;
    name: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
  }) {
    return db.team.upsert({
      where: { shortCode: input.shortCode },
      update: input,
      create: input,
    });
  },

  async upsertMatch(input: {
    externalRef: string;
    matchNumber: number | null;
    stage: MatchStage;
    teamAId: string;
    teamBId: string;
    venue: string | null;
    city: string | null;
    startTimeUtc: Date;
    cutoffTimeUtc: Date;
  }) {
    return db.match.upsert({
      where: { externalRef: input.externalRef },
      update: input,
      create: {
        ...input,
        season: 2026,
        status: MatchStatus.SCHEDULED,
      },
    });
  },

  updateMatch(input: {
    matchId: string;
    stage: MatchStage;
    venue: string | null;
    city: string | null;
    startTimeUtc: Date;
    cutoffTimeUtc: Date;
  }) {
    return db.match.update({
      where: { id: input.matchId },
      data: {
        stage: input.stage,
        venue: input.venue,
        city: input.city,
        startTimeUtc: input.startTimeUtc,
        cutoffTimeUtc: input.cutoffTimeUtc,
      },
      include: {
        teamA: true,
        teamB: true,
        winningTeam: true,
      },
    });
  },

  settleMatch(input: {
    matchId: string;
    status: MatchStatus;
    winningTeamId: string | null;
    settledAt: Date | null;
  }) {
    return db.match.update({
      where: { id: input.matchId },
      data: {
        status: input.status,
        winningTeamId: input.winningTeamId,
        settledAt: input.settledAt,
      },
      include: {
        teamA: true,
        teamB: true,
        winningTeam: true,
      },
    });
  },
};

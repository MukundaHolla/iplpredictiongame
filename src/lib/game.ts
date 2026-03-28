import {
  MatchStage,
  MatchStatus,
  PredictionsRevealMode,
  type Match,
  type Prediction,
  type RoomMembership,
  type User,
} from "@prisma/client";

import { formatMatchDateTime, isSameIstDate } from "@/lib/time";

export type MatchWithOutcome = Pick<
  Match,
  | "id"
  | "matchNumber"
  | "stage"
  | "status"
  | "startTimeUtc"
  | "cutoffTimeUtc"
  | "winningTeamId"
  | "settledAt"
>;

export type PredictionWithTeam = Pick<
  Prediction,
  "userId" | "matchId" | "predictedTeamId" | "submittedAt"
>;

export type MembershipWithUser = Pick<RoomMembership, "userId" | "joinedAt"> & {
  user: Pick<User, "id" | "name" | "image" | "email">;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  email: string | null;
  joinedAt: Date;
  points: number;
  correct: number;
  wrong: number;
  missed: number;
  eligibleMatches: number;
  accuracy: number;
  currentStreak: number;
};

export function isPredictionLocked(now: Date, cutoffTimeUtc: Date) {
  return now.getTime() >= cutoffTimeUtc.getTime();
}

export function isPredictionMatchDay(now: Date, startTimeUtc: Date) {
  return isSameIstDate(now, startTimeUtc);
}

export function canSubmitPrediction(
  now: Date,
  startTimeUtc: Date,
  cutoffTimeUtc: Date,
) {
  return isPredictionMatchDay(now, startTimeUtc) && !isPredictionLocked(now, cutoffTimeUtc);
}

export function getPredictionAvailabilityLabel(
  match: Pick<MatchWithOutcome, "startTimeUtc" | "cutoffTimeUtc" | "status" | "settledAt" | "winningTeamId">,
  now = new Date(),
) {
  if (match.status === MatchStatus.COMPLETED && match.settledAt && match.winningTeamId) {
    return "Result settled";
  }

  if (match.status === MatchStatus.ABANDONED || match.status === MatchStatus.NO_RESULT) {
    return "Result settled";
  }

  if (!isPredictionMatchDay(now, match.startTimeUtc)) {
    return `Predictions open on ${formatMatchDateTime(match.startTimeUtc).shortDate}`;
  }

  if (isPredictionLocked(now, match.cutoffTimeUtc)) {
    return "Prediction window closed";
  }

  return "Predictions are open today";
}

export function getEffectiveMatchStatus(match: MatchWithOutcome, now = new Date()) {
  if (match.status === MatchStatus.ABANDONED || match.status === MatchStatus.NO_RESULT) {
    return match.status;
  }

  if (match.status === MatchStatus.COMPLETED && match.settledAt && match.winningTeamId) {
    return MatchStatus.COMPLETED;
  }

  if (now.getTime() >= match.startTimeUtc.getTime()) {
    return MatchStatus.LIVE;
  }

  if (isPredictionLocked(now, match.cutoffTimeUtc)) {
    return MatchStatus.LOCKED;
  }

  return MatchStatus.SCHEDULED;
}

export function canRevealAggregate(
  revealMode: PredictionsRevealMode,
  match: MatchWithOutcome,
  now = new Date(),
) {
  if (match.settledAt) {
    return true;
  }

  if (revealMode === PredictionsRevealMode.AFTER_CUTOFF) {
    return isPredictionLocked(now, match.cutoffTimeUtc);
  }

  if (revealMode === PredictionsRevealMode.AFTER_MATCH_START) {
    return now.getTime() >= match.startTimeUtc.getTime();
  }

  return Boolean(match.settledAt);
}

export function canRevealIndividualPicks(match: MatchWithOutcome) {
  return Boolean(match.settledAt);
}

export function isPredictableSettledMatch(match: MatchWithOutcome) {
  return (
    match.status === MatchStatus.COMPLETED &&
    Boolean(match.winningTeamId) &&
    Boolean(match.settledAt)
  );
}

export function isNoResultMatch(match: MatchWithOutcome) {
  return match.status === MatchStatus.ABANDONED || match.status === MatchStatus.NO_RESULT;
}

export function countMatchForMember(match: MatchWithOutcome, joinedAt: Date) {
  return match.cutoffTimeUtc.getTime() > joinedAt.getTime();
}

function computeCurrentStreak(
  matches: MatchWithOutcome[],
  predictionsByMatch: Map<string, PredictionWithTeam>,
) {
  const recentMatches = matches
    .filter(isPredictableSettledMatch)
    .sort((left, right) => right.startTimeUtc.getTime() - left.startTimeUtc.getTime());

  let streak = 0;

  for (const match of recentMatches) {
    const prediction = predictionsByMatch.get(match.id);

    if (!prediction || prediction.predictedTeamId !== match.winningTeamId) {
      break;
    }

    streak += 1;
  }

  return streak;
}

export function computeLeaderboard(
  memberships: MembershipWithUser[],
  matches: MatchWithOutcome[],
  predictions: PredictionWithTeam[],
) {
  const predictionsByUser = new Map<string, PredictionWithTeam[]>();

  for (const prediction of predictions) {
    const current = predictionsByUser.get(prediction.userId) ?? [];
    current.push(prediction);
    predictionsByUser.set(prediction.userId, current);
  }

  const entries: LeaderboardEntry[] = memberships.map((membership) => {
    const userPredictions = predictionsByUser.get(membership.userId) ?? [];
    const predictionsByMatch = new Map(
      userPredictions.map((prediction) => [prediction.matchId, prediction]),
    );

    const eligibleMatches = matches.filter(
      (match) =>
        countMatchForMember(match, membership.joinedAt) &&
        (isPredictableSettledMatch(match) || isNoResultMatch(match)),
    );

    let eligiblePredictableCount = 0;
    let correct = 0;
    let wrong = 0;
    let missed = 0;

    for (const match of eligibleMatches) {
      if (isNoResultMatch(match)) {
        continue;
      }

      eligiblePredictableCount += 1;
      const prediction = predictionsByMatch.get(match.id);

      if (!prediction) {
        missed += 1;
        continue;
      }

      if (prediction.predictedTeamId === match.winningTeamId) {
        correct += 1;
      } else {
        wrong += 1;
      }
    }

    const accuracy =
      eligiblePredictableCount === 0 ? 0 : correct / eligiblePredictableCount;

    return {
      rank: 0,
      userId: membership.user.id,
      name: membership.user.name ?? membership.user.email ?? "Anonymous Player",
      image: membership.user.image ?? null,
      email: membership.user.email ?? null,
      joinedAt: membership.joinedAt,
      points: correct,
      correct,
      wrong,
      missed,
      eligibleMatches: eligiblePredictableCount,
      accuracy,
      currentStreak: computeCurrentStreak(
        matches.filter((match) => countMatchForMember(match, membership.joinedAt)),
        predictionsByMatch,
      ),
    };
  });

  entries.sort((left, right) => {
    if (right.points !== left.points) {
      return right.points - left.points;
    }

    if (right.accuracy !== left.accuracy) {
      return right.accuracy - left.accuracy;
    }

    if (left.missed !== right.missed) {
      return left.missed - right.missed;
    }

    return left.joinedAt.getTime() - right.joinedAt.getTime();
  });

  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export function getStageLabel(stage: MatchStage) {
  switch (stage) {
    case MatchStage.FINAL:
      return "Final";
    case MatchStage.QUALIFIER_1:
      return "Qualifier 1";
    case MatchStage.ELIMINATOR:
      return "Eliminator";
    case MatchStage.QUALIFIER_2:
      return "Qualifier 2";
    default:
      return "League";
  }
}

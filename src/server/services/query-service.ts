import { MatchStatus } from "@prisma/client";

import {
  canRevealAggregate,
  canRevealIndividualPicks,
  canSubmitPrediction,
  getPredictionAvailabilityLabel,
  getEffectiveMatchStatus,
  isNoResultMatch,
  isPredictionLocked,
} from "@/lib/game";
import { getCountdownLabel, getIstDateKey } from "@/lib/time";
import type {
  DashboardView,
  HistoryRowView,
  MatchCardView,
  MatchDistributionView,
  MatchIndividualPickView,
  RoomSummaryView,
  RoomsHomeView,
} from "@/lib/types";
import { matchRepository } from "@/server/repositories/match-repository";
import { predictionRepository } from "@/server/repositories/prediction-repository";
import { roomRepository } from "@/server/repositories/room-repository";
import { getLeaderboardPositionForUser, getLeaderboardRows } from "@/server/services/leaderboard-service";
import { getRoomContextForUser, getRoomStateForUser } from "@/server/services/membership-service";

type MatchRecord = Awaited<ReturnType<typeof matchRepository.listMatches>>[number];
type PredictionRecord = Awaited<ReturnType<typeof predictionRepository.listRoomPredictions>>[number];
type MembershipRecord = Awaited<ReturnType<typeof roomRepository.getUserMemberships>>[number];
type RoomRecord = Awaited<ReturnType<typeof roomRepository.listRoomsByIds>>[number];

function buildDistribution(match: MatchRecord, predictionsForMatch: PredictionRecord[]): MatchDistributionView {
  const totalPredictions = predictionsForMatch.length;
  const counts = new Map<string, number>();

  for (const prediction of predictionsForMatch) {
    counts.set(
      prediction.predictedTeamId,
      (counts.get(prediction.predictedTeamId) ?? 0) + 1,
    );
  }

  const teams = [match.teamA, match.teamB];

  return {
    totalPredictions,
    picks: teams.map((team) => {
      const count = counts.get(team.id) ?? 0;

      return {
        teamId: team.id,
        shortCode: team.shortCode,
        count,
        percentage: totalPredictions === 0 ? 0 : count / totalPredictions,
      };
    }),
  };
}

function buildIndividualPicks(predictionsForMatch: PredictionRecord[]): MatchIndividualPickView[] {
  return predictionsForMatch
    .map((prediction) => ({
      userId: prediction.userId,
      name: prediction.user.name ?? prediction.user.email ?? "Anonymous Player",
      image: prediction.user.image ?? null,
      pickedTeamId: prediction.predictedTeamId,
      pickedTeamShortCode: prediction.predictedTeam.shortCode,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function toRoomSummaryView(
  room: RoomRecord,
  joinedAt: Date | null,
): RoomSummaryView {
  return {
    id: room.id,
    slug: room.slug,
    name: room.name,
    isActive: room.isActive,
    joinedAt: joinedAt?.toISOString() ?? null,
    memberCount: room._count.memberships,
    allowlistEnabled: room.allowlistEnabled,
  };
}

async function getJoinedRoomSummaries(memberships: MembershipRecord[]) {
  const roomIds = memberships.map((membership) => membership.roomId);
  const rooms = await roomRepository.listRoomsByIds(roomIds);
  const joinedAtByRoomId = new Map(memberships.map((membership) => [membership.roomId, membership.joinedAt]));

  return rooms.map((room) => toRoomSummaryView(room, joinedAtByRoomId.get(room.id) ?? null));
}

function toMatchCardView(
  match: MatchRecord,
  userPredictionTeamId: string | null,
  userPredictionSubmittedAt: Date | null,
  predictionsForMatch: PredictionRecord[],
  revealMode: DashboardView["revealMode"],
  now: Date,
): MatchCardView {
  const effectiveStatus = getEffectiveMatchStatus(match, now);
  const revealAggregate = canRevealAggregate(revealMode, match, now);
  const revealIndividualPicks = canRevealIndividualPicks(match);
  const canPredictToday =
    canSubmitPrediction(now, match.startTimeUtc, match.cutoffTimeUtc) &&
    effectiveStatus === MatchStatus.SCHEDULED;
  const isCollapsedFutureFixture =
    effectiveStatus === MatchStatus.SCHEDULED &&
    !canPredictToday &&
    !isPredictionLocked(now, match.cutoffTimeUtc);

  return {
    id: match.id,
    externalRef: match.externalRef,
    matchNumber: match.matchNumber,
    stage: match.stage,
    status: effectiveStatus,
    startTimeUtc: match.startTimeUtc.toISOString(),
    cutoffTimeUtc: match.cutoffTimeUtc.toISOString(),
    venue: match.venue,
    city: match.city,
    teamA: {
      id: match.teamA.id,
      name: match.teamA.name,
      shortCode: match.teamA.shortCode,
      logoUrl: match.teamA.logoUrl,
      primaryColor: match.teamA.primaryColor,
      secondaryColor: match.teamA.secondaryColor,
    },
    teamB: {
      id: match.teamB.id,
      name: match.teamB.name,
      shortCode: match.teamB.shortCode,
      logoUrl: match.teamB.logoUrl,
      primaryColor: match.teamB.primaryColor,
      secondaryColor: match.teamB.secondaryColor,
    },
    winningTeamId: match.winningTeamId,
    myPredictionTeamId: userPredictionTeamId,
    myPredictionSubmittedAt: userPredictionSubmittedAt?.toISOString() ?? null,
    isLocked:
      isPredictionLocked(now, match.cutoffTimeUtc) ||
      effectiveStatus === MatchStatus.COMPLETED ||
      effectiveStatus === MatchStatus.ABANDONED ||
      effectiveStatus === MatchStatus.NO_RESULT,
    canPredictToday,
    isCollapsedFutureFixture,
    predictionAvailabilityLabel: getPredictionAvailabilityLabel(match, now),
    countdownLabel: isPredictionLocked(now, match.cutoffTimeUtc)
      ? "Locked"
      : getCountdownLabel(match.cutoffTimeUtc, now),
    revealAggregate,
    revealIndividualPicks,
    distribution: revealAggregate ? buildDistribution(match, predictionsForMatch) : null,
    individualPicks: revealIndividualPicks ? buildIndividualPicks(predictionsForMatch) : [],
  };
}

export async function getDashboardView(userId: string, roomSlug: string): Promise<DashboardView> {
  const { room, membership, memberships, config, user } = await getRoomContextForUser(
    userId,
    roomSlug,
  );

  if (!membership) {
    throw new Error("You must join this room before viewing its dashboard.");
  }

  const now = new Date();
  const [matches, roomPredictions, userRank, joinedRooms] = await Promise.all([
    matchRepository.listMatches(),
    predictionRepository.listRoomPredictions(room.id),
    getLeaderboardPositionForUser(user.id, room.id),
    getJoinedRoomSummaries(memberships),
  ]);

  const userPredictionsByMatch = new Map<string, PredictionRecord>(
    roomPredictions
      .filter((prediction) => prediction.userId === userId)
      .map((prediction) => [prediction.matchId, prediction]),
  );

  const predictionsByMatch = new Map<string, PredictionRecord[]>();

  for (const prediction of roomPredictions) {
    const current = predictionsByMatch.get(prediction.matchId) ?? [];
    current.push(prediction);
    predictionsByMatch.set(prediction.matchId, current);
  }

  const todayKey = getIstDateKey(now);
  const matchCards = matches.map((match) =>
    toMatchCardView(
      match,
      userPredictionsByMatch.get(match.id)?.predictedTeamId ?? null,
      userPredictionsByMatch.get(match.id)?.submittedAt ?? null,
      predictionsByMatch.get(match.id) ?? [],
      config.predictionsRevealMode,
      now,
    ),
  );

  const settledStatuses = new Set<MatchStatus>([
    MatchStatus.COMPLETED,
    MatchStatus.ABANDONED,
    MatchStatus.NO_RESULT,
  ]);

  const currentRoomSummary = joinedRooms.find((joinedRoom) => joinedRoom.id === room.id);

  if (!currentRoomSummary) {
    throw new Error("Room membership is missing from the available rooms list.");
  }

  return {
    greetingName: user.name ?? user.email ?? "Player",
    room: currentRoomSummary,
    joinedRooms,
    myRank: userRank,
    revealMode: config.predictionsRevealMode,
    today: matchCards.filter(
      (match) =>
        getIstDateKey(new Date(match.startTimeUtc)) === todayKey &&
        !settledStatuses.has(match.status),
    ),
    upcoming: matchCards.filter(
      (match) =>
        new Date(match.startTimeUtc).getTime() > now.getTime() &&
        getIstDateKey(new Date(match.startTimeUtc)) !== todayKey &&
        !settledStatuses.has(match.status),
    ),
    settled: matchCards
      .filter((match) => settledStatuses.has(match.status))
      .sort(
        (left, right) =>
          new Date(right.startTimeUtc).getTime() - new Date(left.startTimeUtc).getTime(),
      )
      .slice(0, 10),
  };
}

export async function getAllMatchesView(userId: string, roomSlug: string) {
  const { room, membership, config } = await getRoomContextForUser(userId, roomSlug);

  if (!membership) {
    throw new Error("You must join this room before viewing matches.");
  }

  const now = new Date();
  const [matches, roomPredictions] = await Promise.all([
    matchRepository.listMatches(),
    predictionRepository.listRoomPredictions(room.id),
  ]);

  const userPredictionsByMatch = new Map<string, PredictionRecord>(
    roomPredictions
      .filter((prediction) => prediction.userId === userId)
      .map((prediction) => [prediction.matchId, prediction]),
  );

  const predictionsByMatch = new Map<string, PredictionRecord[]>();

  for (const prediction of roomPredictions) {
    const current = predictionsByMatch.get(prediction.matchId) ?? [];
    current.push(prediction);
    predictionsByMatch.set(prediction.matchId, current);
  }

  return matches.map((match) =>
    toMatchCardView(
      match,
      userPredictionsByMatch.get(match.id)?.predictedTeamId ?? null,
      userPredictionsByMatch.get(match.id)?.submittedAt ?? null,
      predictionsByMatch.get(match.id) ?? [],
      config.predictionsRevealMode,
      now,
    ),
  );
}

export async function getHistoryView(userId: string, roomSlug: string): Promise<HistoryRowView[]> {
  const { room, membership } = await getRoomContextForUser(userId, roomSlug);

  if (!membership) {
    throw new Error("You must join this room before viewing history.");
  }

  const [matches, predictions] = await Promise.all([
    matchRepository.listMatches(),
    predictionRepository.listUserPredictions(room.id, userId),
  ]);

  const predictionsByMatch = new Map<
    string,
    Awaited<ReturnType<typeof predictionRepository.listUserPredictions>>[number]
  >(predictions.map((prediction) => [prediction.matchId, prediction]));

  return matches
    .map((match) => {
      const prediction = predictionsByMatch.get(match.id);
      const countsForUser = match.cutoffTimeUtc.getTime() > membership.joinedAt.getTime();

      let resultLabel: HistoryRowView["resultLabel"] = "Pending";
      let pointsEarned = 0;

      if (!countsForUser) {
        resultLabel = "Pre-Join";
      } else if (isNoResultMatch(match)) {
        resultLabel = "No Result";
      } else if (match.status === MatchStatus.COMPLETED && match.winningTeamId) {
        if (!prediction) {
          resultLabel = "Skipped";
        } else if (prediction.predictedTeamId === match.winningTeamId) {
          resultLabel = "Correct";
          pointsEarned = 1;
        } else {
          resultLabel = "Wrong";
        }
      }

      return {
        matchId: match.id,
        matchNumber: match.matchNumber,
        stage: match.stage,
        startTimeUtc: match.startTimeUtc.toISOString(),
        venue: match.venue,
        city: match.city,
        teamA: {
          id: match.teamA.id,
          name: match.teamA.name,
          shortCode: match.teamA.shortCode,
          logoUrl: match.teamA.logoUrl,
          primaryColor: match.teamA.primaryColor,
          secondaryColor: match.teamA.secondaryColor,
        },
        teamB: {
          id: match.teamB.id,
          name: match.teamB.name,
          shortCode: match.teamB.shortCode,
          logoUrl: match.teamB.logoUrl,
          primaryColor: match.teamB.primaryColor,
          secondaryColor: match.teamB.secondaryColor,
        },
        myPredictionTeamId: prediction?.predictedTeamId ?? null,
        winningTeamId: match.winningTeamId,
        status: match.status,
        resultLabel,
        pointsEarned,
      };
    })
    .sort(
      (left, right) =>
        new Date(right.startTimeUtc).getTime() - new Date(left.startTimeUtc).getTime(),
    );
}

export async function getLeaderboardView(userId: string, roomSlug: string) {
  const { room, membership } = await getRoomContextForUser(userId, roomSlug);

  if (!membership) {
    throw new Error("You must join this room before viewing the leaderboard.");
  }

  return getLeaderboardRows(room.id);
}

export async function getRoomsHomeView(userId: string): Promise<RoomsHomeView> {
  const { memberships, membership } = await getRoomStateForUser(userId);
  const rooms = await getJoinedRoomSummaries(memberships);

  return {
    currentRoomSlug: membership?.room.slug ?? null,
    rooms,
  };
}

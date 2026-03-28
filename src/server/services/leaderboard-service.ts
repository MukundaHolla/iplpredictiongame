import {
  computeLeaderboard,
  type LeaderboardEntry,
  type MatchWithOutcome,
  type MembershipWithUser,
  type PredictionWithTeam,
} from "@/lib/game";
import type { LeaderboardRowView } from "@/lib/types";
import { matchRepository } from "@/server/repositories/match-repository";
import { predictionRepository } from "@/server/repositories/prediction-repository";
import { roomRepository } from "@/server/repositories/room-repository";
import { ensureSystemReady } from "@/server/services/system-service";

async function loadLeaderboardInputs() {
  await ensureSystemReady();

  const room = await roomRepository.getActiveRoom();

  if (!room) {
    throw new Error("The private room has not been created yet.");
  }

  const [memberships, predictions, matches] = await Promise.all([
    roomRepository.listMemberships(room.id),
    predictionRepository.listRoomPredictions(room.id),
    matchRepository.listMatches(),
  ]);

  return {
    room,
    memberships: memberships as MembershipWithUser[],
    predictions: predictions as PredictionWithTeam[],
    matches: matches as MatchWithOutcome[],
  };
}

function toLeaderboardRows(entries: LeaderboardEntry[]): LeaderboardRowView[] {
  return entries.map((entry) => ({
    rank: entry.rank,
    userId: entry.userId,
    name: entry.name,
    image: entry.image,
    points: entry.points,
    correct: entry.correct,
    wrong: entry.wrong,
    missed: entry.missed,
    eligibleMatches: entry.eligibleMatches,
    accuracy: entry.accuracy,
    currentStreak: entry.currentStreak,
  }));
}

export async function getLeaderboardRows() {
  const { memberships, predictions, matches } = await loadLeaderboardInputs();
  const entries = computeLeaderboard(memberships, matches, predictions);

  return toLeaderboardRows(entries);
}

export async function getLeaderboardPositionForUser(userId: string) {
  const rows = await getLeaderboardRows();
  return rows.find((row) => row.userId === userId)?.rank ?? null;
}

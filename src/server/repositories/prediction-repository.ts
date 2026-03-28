import { db } from "@/lib/db";

export const predictionRepository = {
  getPrediction(roomId: string, userId: string, matchId: string) {
    return db.prediction.findUnique({
      where: {
        roomId_userId_matchId: {
          roomId,
          userId,
          matchId,
        },
      },
    });
  },

  listRoomPredictions(roomId: string) {
    return db.prediction.findMany({
      where: { roomId },
      include: {
        user: true,
        predictedTeam: true,
      },
    });
  },

  listUserPredictions(roomId: string, userId: string) {
    return db.prediction.findMany({
      where: {
        roomId,
        userId,
      },
    });
  },

  upsertPrediction(input: {
    roomId: string;
    userId: string;
    matchId: string;
    predictedTeamId: string;
    submittedAt: Date;
    isLockedSnapshot: boolean;
  }) {
    return db.prediction.upsert({
      where: {
        roomId_userId_matchId: {
          roomId: input.roomId,
          userId: input.userId,
          matchId: input.matchId,
        },
      },
      update: {
        predictedTeamId: input.predictedTeamId,
        submittedAt: input.submittedAt,
        isLockedSnapshot: input.isLockedSnapshot,
      },
      create: input,
    });
  },
};

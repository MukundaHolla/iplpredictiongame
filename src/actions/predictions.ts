"use server";

import { ZodError } from "zod";

import { auth } from "@/auth";
import type { ActionResult } from "@/lib/action-result";
import {
  canSubmitPrediction,
  isPredictionLocked,
  isPredictionMatchDay,
} from "@/lib/game";
import { revalidateAppPaths } from "@/lib/revalidate";
import { predictionInputSchema } from "@/lib/validation";
import { matchRepository } from "@/server/repositories/match-repository";
import { predictionRepository } from "@/server/repositories/prediction-repository";
import { getRoomStateForUser } from "@/server/services/membership-service";

export async function upsertPredictionAction(input: unknown): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Please sign in to submit a prediction.",
    };
  }

  try {
    const parsed = predictionInputSchema.parse(input);
    const { room, membership } = await getRoomStateForUser(session.user.id);

    if (!membership) {
      return {
        success: false,
        message: "Join the private room before making predictions.",
      };
    }

    const match = await matchRepository.getMatchById(parsed.matchId);

    if (!match) {
      return {
        success: false,
        message: "That match could not be found.",
      };
    }

    if (match.teamAId !== parsed.predictedTeamId && match.teamBId !== parsed.predictedTeamId) {
      return {
        success: false,
        message: "Predictions must choose one of the two teams in the fixture.",
      };
    }

    const now = new Date();

    if (!isPredictionMatchDay(now, match.startTimeUtc)) {
      return {
        success: false,
        message: "Predictions open only on the match day in IST.",
      };
    }

    if (isPredictionLocked(now, match.cutoffTimeUtc)) {
      return {
        success: false,
        message: "This fixture is locked, so predictions can no longer be edited.",
      };
    }

    if (!canSubmitPrediction(now, match.startTimeUtc, match.cutoffTimeUtc)) {
      return {
        success: false,
        message: "This prediction is not available right now.",
      };
    }

    await predictionRepository.upsertPrediction({
      roomId: room.id,
      userId: session.user.id,
      matchId: match.id,
      predictedTeamId: parsed.predictedTeamId,
      submittedAt: now,
      isLockedSnapshot: false,
    });

    await revalidateAppPaths();

    return {
      success: true,
      message: "Prediction saved.",
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        message: "The prediction payload is invalid.",
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "We couldn’t save that prediction right now.",
    };
  }
}

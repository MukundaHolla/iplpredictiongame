import { MatchStage, MatchStatus, PredictionsRevealMode } from "@prisma/client";
import { z } from "zod";

export const joinRoomSchema = z.object({
  code: z.string().trim().min(4).max(64),
});

export const predictionInputSchema = z.object({
  matchId: z.string().trim().min(1),
  predictedTeamId: z.string().trim().min(1),
});

export const adminMatchUpdateSchema = z.object({
  matchId: z.string().trim().min(1),
  stage: z.nativeEnum(MatchStage).default(MatchStage.LEAGUE),
  venue: z.string().trim().max(120).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  startTimeLocal: z.string().trim().min(1),
  cutoffMinutes: z.coerce.number().int().min(0).max(1440),
});

export const adminSettlementSchema = z
  .object({
    matchId: z.string().trim().min(1),
    status: z.enum([
      MatchStatus.COMPLETED,
      MatchStatus.ABANDONED,
      MatchStatus.NO_RESULT,
    ]),
    winningTeamId: z.string().trim().optional().nullable(),
  })
  .superRefine((input, ctx) => {
    if (input.status === MatchStatus.COMPLETED && !input.winningTeamId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A winning team is required when settling a completed match.",
        path: ["winningTeamId"],
      });
    }

    if (
      (input.status === MatchStatus.ABANDONED || input.status === MatchStatus.NO_RESULT) &&
      input.winningTeamId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "No winning team should be selected for abandoned or no-result matches.",
        path: ["winningTeamId"],
      });
    }
  });

export const adminConfigSchema = z.object({
  defaultCutoffMinutes: z.coerce.number().int().min(0).max(1440),
  allowlistEnabled: z.boolean(),
  predictionsRevealMode: z.nativeEnum(PredictionsRevealMode),
});

export const adminAllowlistUpsertSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase().trim()),
  isActive: z.boolean().default(true),
});

export const adminAllowlistToggleSchema = z.object({
  id: z.string().trim().min(1),
  isActive: z.boolean(),
});

export const adminAllowlistRemoveSchema = z.object({
  id: z.string().trim().min(1),
});

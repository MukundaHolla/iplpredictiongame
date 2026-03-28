"use server";

import { ZodError } from "zod";

import { auth } from "@/auth";
import type { ActionResult } from "@/lib/action-result";
import { revalidateAppPaths } from "@/lib/revalidate";
import {
  recalculateLeaderboard,
  removeAllowedEmail,
  seedFixtures,
  settleFixtureResult,
  toggleAllowedEmail,
  unsettleFixture,
  updateAppConfig,
  updateFixture,
  upsertAllowedEmail,
} from "@/server/services/admin-service";

async function getAdminUserId() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Only admins can perform that action.");
  }

  return session.user.id;
}

function toActionFailure<T>(error: unknown): ActionResult<T> {
  if (error instanceof ZodError) {
    return {
      success: false,
      message: "Some of the submitted values are invalid.",
      fieldErrors: error.flatten().fieldErrors,
    };
  }

  return {
    success: false,
    message: error instanceof Error ? error.message : "The admin action failed.",
  };
}

export async function adminSeedFixturesAction(): Promise<ActionResult<{ matchCount: number }>> {
  try {
    const actorUserId = await getAdminUserId();
    const result = await seedFixtures(actorUserId);
    await revalidateAppPaths();

    return {
      success: true,
      message: "Fixtures and teams were synced from the official seed data.",
      data: { matchCount: result.matchCount },
    };
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function adminUpdateMatchAction(input: unknown): Promise<ActionResult> {
  try {
    const actorUserId = await getAdminUserId();
    await updateFixture(actorUserId, input);
    await revalidateAppPaths();

    return {
      success: true,
      message: "Fixture updated.",
    };
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function adminSettleMatchAction(input: unknown): Promise<ActionResult> {
  try {
    const actorUserId = await getAdminUserId();
    await settleFixtureResult(actorUserId, input);
    await revalidateAppPaths();

    return {
      success: true,
      message: "Match result settled.",
    };
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function adminUnsettleMatchAction(matchId: string): Promise<ActionResult> {
  try {
    const actorUserId = await getAdminUserId();
    await unsettleFixture(actorUserId, matchId);
    await revalidateAppPaths();

    return {
      success: true,
      message: "Match settlement removed.",
    };
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function adminRecalculateAction(): Promise<ActionResult<{ rowCount: number }>> {
  try {
    const actorUserId = await getAdminUserId();
    const rows = await recalculateLeaderboard(actorUserId);
    await revalidateAppPaths();

    return {
      success: true,
      message: "Leaderboard recalculated.",
      data: { rowCount: rows.length },
    };
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function adminUpdateConfigAction(input: unknown): Promise<ActionResult> {
  try {
    const actorUserId = await getAdminUserId();
    await updateAppConfig(actorUserId, input);
    await revalidateAppPaths();

    return {
      success: true,
      message: "App configuration updated.",
    };
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function adminUpsertAllowedEmailAction(input: unknown): Promise<ActionResult> {
  try {
    const actorUserId = await getAdminUserId();
    await upsertAllowedEmail(actorUserId, input);
    await revalidateAppPaths();

    return {
      success: true,
      message: "Allowlist updated.",
    };
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function adminToggleAllowedEmailAction(input: unknown): Promise<ActionResult> {
  try {
    const actorUserId = await getAdminUserId();
    await toggleAllowedEmail(actorUserId, input);
    await revalidateAppPaths();

    return {
      success: true,
      message: "Allowlist entry updated.",
    };
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function adminRemoveAllowedEmailAction(input: unknown): Promise<ActionResult> {
  try {
    const actorUserId = await getAdminUserId();
    await removeAllowedEmail(actorUserId, input);
    await revalidateAppPaths();

    return {
      success: true,
      message: "Allowlist entry removed.",
    };
  } catch (error) {
    return toActionFailure(error);
  }
}

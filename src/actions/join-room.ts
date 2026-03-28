"use server";

import { ZodError } from "zod";

import { auth } from "@/auth";
import type { ActionResult } from "@/lib/action-result";
import { revalidateAppPaths } from "@/lib/revalidate";
import { getRoomDashboardPath, getRoomScopedPaths } from "@/lib/rooms";
import { joinRoomSchema } from "@/lib/validation";
import { joinRoomByCode } from "@/server/services/membership-service";

export async function joinRoomAction(
  input: unknown,
): Promise<ActionResult<{ roomSlug: string; redirectPath: string }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Please sign in with Google first.",
    };
  }

  try {
    const parsed = joinRoomSchema.parse(input);
    const membership = await joinRoomByCode(session.user.id, parsed.code);
    const redirectPath = getRoomDashboardPath(membership.room.slug);
    await revalidateAppPaths(["/rooms", redirectPath, ...getRoomScopedPaths(membership.room.slug)]);

    return {
      success: true,
      message: "You’re in. Welcome to the room.",
      data: {
        roomSlug: membership.room.slug,
        redirectPath,
      },
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Please check the room code and try again.",
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unable to join a room right now.",
    };
  }
}

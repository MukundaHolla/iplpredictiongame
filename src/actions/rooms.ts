"use server";

import { ZodError } from "zod";

import { auth } from "@/auth";
import type { ActionResult } from "@/lib/action-result";
import { revalidateAppPaths } from "@/lib/revalidate";
import { getRoomDashboardPath, getRoomScopedPaths } from "@/lib/rooms";
import { roomSwitchSchema } from "@/lib/validation";
import { switchActiveRoom } from "@/server/services/membership-service";

export async function switchActiveRoomAction(
  input: unknown,
): Promise<ActionResult<{ roomSlug: string; redirectPath: string }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Please sign in first.",
    };
  }

  try {
    const parsed = roomSwitchSchema.parse(input);
    const room = await switchActiveRoom(session.user.id, parsed.roomSlug);
    const redirectPath = getRoomDashboardPath(room.slug);

    await revalidateAppPaths(["/rooms", redirectPath, ...getRoomScopedPaths(room.slug)]);

    return {
      success: true,
      message: "Room switched.",
      data: {
        roomSlug: room.slug,
        redirectPath,
      },
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        message: "The selected room is invalid.",
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to switch rooms right now.",
    };
  }
}

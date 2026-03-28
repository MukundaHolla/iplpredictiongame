"use server";

import { ZodError } from "zod";

import { auth } from "@/auth";
import type { ActionResult } from "@/lib/action-result";
import { revalidateAppPaths } from "@/lib/revalidate";
import { joinRoomSchema } from "@/lib/validation";
import { joinPrivateRoom } from "@/server/services/membership-service";

export async function joinRoomAction(input: unknown): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Please sign in with Google first.",
    };
  }

  try {
    const parsed = joinRoomSchema.parse(input);
    await joinPrivateRoom(session.user.id, parsed.code);
    await revalidateAppPaths();

    return {
      success: true,
      message: "You’re in. Welcome to the room.",
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
        error instanceof Error ? error.message : "Unable to join the private room right now.",
    };
  }
}

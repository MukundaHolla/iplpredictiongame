import { auditRepository } from "@/server/repositories/audit-repository";
import { configRepository } from "@/server/repositories/config-repository";
import { roomRepository } from "@/server/repositories/room-repository";
import { userRepository } from "@/server/repositories/user-repository";
import { ensureSystemReady } from "@/server/services/system-service";

export async function getRoomStateForUser(userId: string) {
  await ensureSystemReady();

  const [room, membership, config, user] = await Promise.all([
    roomRepository.getActiveRoom(),
    roomRepository.getMembershipByUserId(userId),
    configRepository.getAppConfig(),
    userRepository.getUserById(userId),
  ]);

  if (!room) {
    throw new Error("The private room has not been initialized yet.");
  }

  if (!config) {
    throw new Error("The application configuration is missing.");
  }

  if (!user) {
    throw new Error("User record not found.");
  }

  return {
    room,
    membership,
    config,
    user,
  };
}

export async function joinPrivateRoom(userId: string, code: string) {
  const { room, config, user } = await getRoomStateForUser(userId);

  if (!room.isActive) {
    throw new Error("The private room is currently inactive.");
  }

  if (room.code.toLowerCase() !== code.trim().toLowerCase()) {
    throw new Error("That room code doesn’t match this private room.");
  }

  if (config.allowlistEnabled) {
    if (!user.email) {
      throw new Error("Your Google account does not expose an email address.");
    }

    const allowedEmail = await configRepository.findAllowedEmail(user.email.toLowerCase());

    if (!allowedEmail?.isActive) {
      throw new Error("This Google account is not on the invite list for the private room.");
    }
  }

  const membership = await roomRepository.joinRoom(room.id, userId);

  await auditRepository.create({
    actorUserId: userId,
    action: "ROOM_JOINED",
    entityType: "Room",
    entityId: room.id,
    payload: {
      roomCode: room.code,
    },
  });

  return membership;
}

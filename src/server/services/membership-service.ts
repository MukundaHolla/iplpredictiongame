import { getRoomDashboardPath } from "@/lib/rooms";
import { auditRepository } from "@/server/repositories/audit-repository";
import { configRepository } from "@/server/repositories/config-repository";
import { roomRepository } from "@/server/repositories/room-repository";
import { userRepository } from "@/server/repositories/user-repository";
import { ensureSystemReady } from "@/server/services/system-service";

type MembershipRecord = Awaited<ReturnType<typeof roomRepository.getUserMemberships>>[number];

function getPreferredMembership(
  memberships: MembershipRecord[],
  lastRoomId: string | null | undefined,
) {
  const activeMemberships = memberships.filter((membership) => membership.room.isActive);

  if (lastRoomId) {
    const matchingLastRoom =
      activeMemberships.find((membership) => membership.roomId === lastRoomId) ??
      memberships.find((membership) => membership.roomId === lastRoomId);

    if (matchingLastRoom) {
      return matchingLastRoom;
    }
  }

  return activeMemberships[0] ?? memberships[0] ?? null;
}

export async function getRoomStateForUser(userId: string) {
  await ensureSystemReady();

  const [config, user, memberships] = await Promise.all([
    configRepository.getAppConfig(),
    userRepository.getUserById(userId),
    roomRepository.getUserMemberships(userId),
  ]);

  if (!config) {
    throw new Error("The application configuration is missing.");
  }

  if (!user) {
    throw new Error("User record not found.");
  }

  const preferredMembership = getPreferredMembership(memberships, user.lastRoomId);

  return {
    room: preferredMembership?.room ?? null,
    membership: preferredMembership,
    memberships,
    config,
    user,
  };
}

export async function getPreferredRoomRedirectPath(userId: string) {
  const state = await getRoomStateForUser(userId);

  if (!state.membership?.room) {
    return "/rooms";
  }

  return getRoomDashboardPath(state.membership.room.slug);
}

export async function getRoomContextForUser(userId: string, roomSlug: string) {
  await ensureSystemReady();

  const [config, user, memberships, room] = await Promise.all([
    configRepository.getAppConfig(),
    userRepository.getUserById(userId),
    roomRepository.getUserMemberships(userId),
    roomRepository.getRoomBySlug(roomSlug),
  ]);

  if (!config) {
    throw new Error("The application configuration is missing.");
  }

  if (!user) {
    throw new Error("User record not found.");
  }

  if (!room) {
    throw new Error("Room not found.");
  }

  const membership = memberships.find((entry) => entry.roomId === room.id) ?? null;

  if (membership && user.lastRoomId !== room.id) {
    await userRepository.updateLastRoom(userId, room.id);
    user.lastRoomId = room.id;
  }

  return {
    room,
    membership,
    memberships,
    config,
    user,
  };
}

export async function joinRoomByCode(userId: string, code: string) {
  await ensureSystemReady();

  const [user, room] = await Promise.all([
    userRepository.getUserById(userId),
    roomRepository.getRoomByCode(code.trim()),
  ]);

  if (!user) {
    throw new Error("User record not found.");
  }

  if (!room) {
    throw new Error("That room code doesn’t match any private room.");
  }

  if (!room.isActive) {
    throw new Error("This room is currently inactive.");
  }

  if (room.allowlistEnabled) {
    if (!user.email) {
      throw new Error("Your Google account does not expose an email address.");
    }

    const allowedEmail = await configRepository.findAllowedEmail(
      room.id,
      user.email.toLowerCase(),
    );

    if (!allowedEmail?.isActive) {
      throw new Error("This Google account is not on the invite list for this room.");
    }
  }

  const membership = await roomRepository.joinRoom(room.id, userId);
  await userRepository.updateLastRoom(userId, room.id);

  await auditRepository.create({
    actorUserId: userId,
    action: "ROOM_JOINED",
    entityType: "Room",
    entityId: room.id,
    payload: {
      roomCode: room.code,
      roomSlug: room.slug,
    },
  });

  return membership;
}

export async function switchActiveRoom(userId: string, roomSlug: string) {
  const context = await getRoomContextForUser(userId, roomSlug);

  if (!context.membership) {
    throw new Error("Join this room before switching to it.");
  }

  if (!context.room.isActive) {
    throw new Error("This room is currently inactive.");
  }

  await userRepository.updateLastRoom(userId, context.room.id);

  return context.room;
}

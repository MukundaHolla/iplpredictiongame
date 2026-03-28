import { APP_NAME, SINGLE_ROOM_NAME } from "@/lib/constants";
import {
  getAdminEmails,
  getAllowlistEnabledDefault,
  getDefaultCutoffMinutes,
  getPrivateRoomCode,
} from "@/lib/env";
import { configRepository } from "@/server/repositories/config-repository";
import { roomRepository } from "@/server/repositories/room-repository";
import { userRepository } from "@/server/repositories/user-repository";

export async function ensureSystemReady() {
  const roomCode = getPrivateRoomCode();
  const adminEmails = [...getAdminEmails()];

  await roomRepository.syncSingletonRoom({
    code: roomCode,
    name: `${APP_NAME} · ${SINGLE_ROOM_NAME}`,
  });

  await configRepository.upsertDefaults({
    defaultCutoffMinutes: getDefaultCutoffMinutes(),
    allowlistEnabled: getAllowlistEnabledDefault(),
  });

  await Promise.all([
    ...adminEmails.map((email) => configRepository.upsertAllowedEmail(email, true)),
    userRepository.syncAdminRoles(adminEmails),
  ]);
}

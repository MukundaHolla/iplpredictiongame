import { APP_NAME, SINGLE_ROOM_NAME } from "@/lib/constants";
import {
  getAdminEmails,
  getAllowlistEnabledDefault,
  getDefaultCutoffMinutes,
  getPrivateRoomCode,
} from "@/lib/env";
import { slugifyRoomName } from "@/lib/rooms";
import { configRepository } from "@/server/repositories/config-repository";
import { roomRepository } from "@/server/repositories/room-repository";
import { userRepository } from "@/server/repositories/user-repository";

export async function ensureSystemReady() {
  const roomCode = getPrivateRoomCode();
  const adminEmails = [...getAdminEmails()];
  const defaultRoomName = `${APP_NAME} · ${SINGLE_ROOM_NAME}`;

  const room = await roomRepository.ensureDefaultRoom({
    code: roomCode,
    slug: slugifyRoomName(SINGLE_ROOM_NAME),
    name: defaultRoomName,
    allowlistEnabled: getAllowlistEnabledDefault(),
  });

  await configRepository.upsertDefaults({
      defaultCutoffMinutes: getDefaultCutoffMinutes(),
  });

  await Promise.all([
    ...adminEmails.map((email) => configRepository.upsertAllowedEmail(room.id, email, true)),
    userRepository.syncAdminRoles(adminEmails),
  ]);
}

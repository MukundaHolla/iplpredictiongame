import { MatchStage, MatchStatus } from "@prisma/client";

import seedData from "../../../prisma/seed-data/ipl-2026.json";
import type { AdminRoomMemberView } from "@/lib/types";
import { getEffectiveMatchStatus } from "@/lib/game";
import { slugifyRoomName } from "@/lib/rooms";
import { calculateCutoffTime, getIstDateKey, parseIstDateTimeInput } from "@/lib/time";
import {
  adminAllowlistRemoveSchema,
  adminAllowlistToggleSchema,
  adminRoomMemberUpdateSchema,
  adminAllowlistUpsertSchema,
  adminConfigSchema,
  adminMatchUpdateSchema,
  adminRoomCreateSchema,
  adminRoomUpdateSchema,
  adminSettlementSchema,
} from "@/lib/validation";
import { auditRepository } from "@/server/repositories/audit-repository";
import { configRepository } from "@/server/repositories/config-repository";
import { matchRepository } from "@/server/repositories/match-repository";
import { roomRepository } from "@/server/repositories/room-repository";
import { userRepository } from "@/server/repositories/user-repository";
import { getLeaderboardRows } from "@/server/services/leaderboard-service";
import { ensureSystemReady } from "@/server/services/system-service";

type SeedData = typeof seedData;

async function getAppConfigOrThrow() {
  const config = await configRepository.getAppConfig();

  if (!config) {
    throw new Error("App configuration is missing.");
  }

  return config;
}

async function getRoomOrThrow(roomSlug: string) {
  const room = await roomRepository.getRoomBySlug(roomSlug);

  if (!room) {
    throw new Error("Room not found.");
  }

  return room;
}

function getAdminMatchPriority(
  match: Awaited<ReturnType<typeof matchRepository.listMatches>>[number],
  now: Date,
) {
  const effectiveStatus = getEffectiveMatchStatus(match, now);
  const isUnsettled =
    effectiveStatus === MatchStatus.SCHEDULED ||
    effectiveStatus === MatchStatus.LOCKED ||
    effectiveStatus === MatchStatus.LIVE;
  const isToday = getIstDateKey(now) === getIstDateKey(match.startTimeUtc);

  if (isUnsettled && isToday) {
    return 0;
  }

  if (isUnsettled) {
    return 1;
  }

  return 2;
}

function sortAdminMatches(
  matches: Awaited<ReturnType<typeof matchRepository.listMatches>>,
  now: Date,
) {
  return [...matches].sort((left, right) => {
    const leftPriority = getAdminMatchPriority(left, now);
    const rightPriority = getAdminMatchPriority(right, now);

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    if (leftPriority === 0) {
      return left.startTimeUtc.getTime() - right.startTimeUtc.getTime();
    }

    if (leftPriority === 1) {
      return (
        Math.abs(left.startTimeUtc.getTime() - now.getTime()) -
        Math.abs(right.startTimeUtc.getTime() - now.getTime())
      );
    }

    return right.startTimeUtc.getTime() - left.startTimeUtc.getTime();
  });
}

function toAdminRoomMemberView(
  membership: Awaited<ReturnType<typeof roomRepository.listMemberships>>[number],
): AdminRoomMemberView {
  return {
    userId: membership.userId,
    name: membership.user.name ?? membership.user.email ?? "Anonymous Player",
    email: membership.user.email ?? null,
    image: membership.user.image ?? null,
    role: membership.user.role,
    joinedAt: membership.joinedAt.toISOString(),
    removedAt: membership.removedAt?.toISOString() ?? null,
    isActive: membership.isActive,
  };
}

export async function seedFixtures(actorUserId: string) {
  await ensureSystemReady();
  const config = await getAppConfigOrThrow();

  const teamIds = new Map<string, string>();

  for (const team of (seedData as SeedData).teams) {
    const createdTeam = await matchRepository.upsertTeam(team);
    teamIds.set(team.shortCode, createdTeam.id);
  }

  for (const fixture of (seedData as SeedData).matches) {
    const startTimeUtc = new Date(fixture.startTimeUtc);

    await matchRepository.upsertMatch({
      externalRef: fixture.externalRef,
      matchNumber: fixture.matchNumber,
      stage: MatchStage.LEAGUE,
      teamAId: teamIds.get(fixture.teamAShortCode)!,
      teamBId: teamIds.get(fixture.teamBShortCode)!,
      venue: fixture.venue,
      city: fixture.city,
      startTimeUtc,
      cutoffTimeUtc: calculateCutoffTime(startTimeUtc, config.defaultCutoffMinutes),
    });
  }

  await auditRepository.create({
    actorUserId,
    action: "FIXTURES_SEEDED",
    entityType: "Match",
    entityId: "season-2026",
    payload: {
      matchCount: (seedData as SeedData).matches.length,
      teamCount: (seedData as SeedData).teams.length,
    },
  });

  return {
    matchCount: (seedData as SeedData).matches.length,
    teamCount: (seedData as SeedData).teams.length,
  };
}

export async function createRoom(actorUserId: string, input: unknown) {
  const parsed = adminRoomCreateSchema.parse(input);
  const room = await roomRepository.createRoom({
    name: parsed.name,
    slug: parsed.slug || slugifyRoomName(parsed.name),
    code: parsed.code,
    isActive: parsed.isActive,
    allowlistEnabled: parsed.allowlistEnabled,
  });

  await auditRepository.create({
    actorUserId,
    action: "ROOM_CREATED",
    entityType: "Room",
    entityId: room.id,
    payload: {
      slug: room.slug,
      name: room.name,
      code: room.code,
      isActive: room.isActive,
      allowlistEnabled: room.allowlistEnabled,
    },
  });

  return room;
}

export async function updateRoom(actorUserId: string, input: unknown) {
  const parsed = adminRoomUpdateSchema.parse(input);
  const room = await roomRepository.updateRoom({
    roomId: parsed.roomId,
    name: parsed.name,
    slug: parsed.slug || slugifyRoomName(parsed.name),
    code: parsed.code,
    isActive: parsed.isActive,
    allowlistEnabled: parsed.allowlistEnabled,
  });

  await auditRepository.create({
    actorUserId,
    action: "ROOM_UPDATED",
    entityType: "Room",
    entityId: room.id,
    payload: {
      slug: room.slug,
      name: room.name,
      code: room.code,
      isActive: room.isActive,
      allowlistEnabled: room.allowlistEnabled,
    },
  });

  return room;
}

export async function updateFixture(actorUserId: string, input: unknown) {
  const parsed = adminMatchUpdateSchema.parse(input);
  const match = await matchRepository.getMatchById(parsed.matchId);

  if (!match) {
    throw new Error("Match not found.");
  }

  const startTimeUtc = parseIstDateTimeInput(parsed.startTimeLocal);
  const cutoffTimeUtc = calculateCutoffTime(startTimeUtc, parsed.cutoffMinutes);

  const updatedMatch = await matchRepository.updateMatch({
    matchId: parsed.matchId,
    stage: parsed.stage,
    venue: parsed.venue ?? null,
    city: parsed.city ?? null,
    startTimeUtc,
    cutoffTimeUtc,
  });

  await auditRepository.create({
    actorUserId,
    action: "FIXTURE_UPDATED",
    entityType: "Match",
    entityId: parsed.matchId,
    payload: {
      stage: parsed.stage,
      venue: parsed.venue ?? null,
      city: parsed.city ?? null,
      startTimeUtc: startTimeUtc.toISOString(),
      cutoffTimeUtc: cutoffTimeUtc.toISOString(),
    },
  });

  return updatedMatch;
}

export async function settleFixtureResult(actorUserId: string, input: unknown) {
  const parsed = adminSettlementSchema.parse(input);
  const match = await matchRepository.getMatchById(parsed.matchId);

  if (!match) {
    throw new Error("Match not found.");
  }

  if (
    parsed.winningTeamId &&
    parsed.winningTeamId !== match.teamAId &&
    parsed.winningTeamId !== match.teamBId
  ) {
    throw new Error("The selected winning team does not belong to this fixture.");
  }

  const settledAt = new Date();

  const updatedMatch = await matchRepository.settleMatch({
    matchId: parsed.matchId,
    status: parsed.status,
    winningTeamId: parsed.status === MatchStatus.COMPLETED ? parsed.winningTeamId ?? null : null,
    settledAt,
  });

  await auditRepository.create({
    actorUserId,
    action: "MATCH_SETTLED",
    entityType: "Match",
    entityId: parsed.matchId,
    payload: {
      status: parsed.status,
      winningTeamId: parsed.winningTeamId ?? null,
      settledAt: settledAt.toISOString(),
    },
  });

  return updatedMatch;
}

export async function unsettleFixture(actorUserId: string, matchId: string) {
  const match = await matchRepository.getMatchById(matchId);

  if (!match) {
    throw new Error("Match not found.");
  }

  await matchRepository.settleMatch({
    matchId,
    status: MatchStatus.SCHEDULED,
    winningTeamId: null,
    settledAt: null,
  });

  await auditRepository.create({
    actorUserId,
    action: "MATCH_UNSETTLED",
    entityType: "Match",
    entityId: matchId,
    payload: null,
  });
}

export async function updateAppConfig(actorUserId: string, input: unknown) {
  const parsed = adminConfigSchema.parse(input);
  const updated = await configRepository.updateAppConfig(parsed);

  await auditRepository.create({
    actorUserId,
    action: "APP_CONFIG_UPDATED",
    entityType: "AppConfig",
    entityId: updated.id,
    payload: parsed,
  });

  return updated;
}

export async function upsertAllowedEmail(actorUserId: string, input: unknown) {
  const parsed = adminAllowlistUpsertSchema.parse(input);
  const room = await getRoomOrThrow(parsed.roomSlug);
  const record = await configRepository.upsertAllowedEmail(room.id, parsed.email, parsed.isActive);

  await auditRepository.create({
    actorUserId,
    action: "ALLOWLIST_EMAIL_UPSERTED",
    entityType: "AllowedEmail",
    entityId: record.id,
    payload: {
      roomSlug: room.slug,
      email: parsed.email,
      isActive: parsed.isActive,
    },
  });

  return record;
}

export async function toggleAllowedEmail(actorUserId: string, input: unknown) {
  const parsed = adminAllowlistToggleSchema.parse(input);
  const room = await getRoomOrThrow(parsed.roomSlug);
  const record = await configRepository.updateAllowedEmail(parsed.id, parsed.isActive);

  await auditRepository.create({
    actorUserId,
    action: "ALLOWLIST_EMAIL_TOGGLED",
    entityType: "AllowedEmail",
    entityId: record.id,
    payload: {
      roomSlug: room.slug,
      isActive: parsed.isActive,
    },
  });

  return record;
}

export async function removeAllowedEmail(actorUserId: string, input: unknown) {
  const parsed = adminAllowlistRemoveSchema.parse(input);
  const room = await getRoomOrThrow(parsed.roomSlug);
  const record = await configRepository.removeAllowedEmail(parsed.id);

  await auditRepository.create({
    actorUserId,
    action: "ALLOWLIST_EMAIL_REMOVED",
    entityType: "AllowedEmail",
    entityId: record.id,
    payload: {
      roomSlug: room.slug,
      email: record.email,
    },
  });

  return record;
}

export async function removeRoomMember(actorUserId: string, input: unknown) {
  const parsed = adminRoomMemberUpdateSchema.parse(input);
  const room = await getRoomOrThrow(parsed.roomSlug);
  const membership = await roomRepository.getMembershipForUser(parsed.userId, room.id);

  if (!membership) {
    throw new Error("That player is not part of this room.");
  }

  if (!membership.isActive) {
    throw new Error("That player is already removed from this room.");
  }

  const removedAt = new Date();

  const updatedMembership = await roomRepository.updateMembershipState({
    roomId: room.id,
    userId: parsed.userId,
    isActive: false,
    removedAt,
  });

  const fallbackMemberships = await roomRepository.getUserMemberships(parsed.userId);
  await userRepository.updateLastRoom(parsed.userId, fallbackMemberships[0]?.roomId ?? null);

  await auditRepository.create({
    actorUserId,
    action: "ROOM_MEMBER_REMOVED",
    entityType: "RoomMembership",
    entityId: updatedMembership.id,
    payload: {
      roomSlug: room.slug,
      targetUserId: updatedMembership.userId,
      targetEmail: updatedMembership.user.email ?? null,
      removedAt: removedAt.toISOString(),
    },
  });

  return updatedMembership;
}

export async function restoreRoomMember(actorUserId: string, input: unknown) {
  const parsed = adminRoomMemberUpdateSchema.parse(input);
  const room = await getRoomOrThrow(parsed.roomSlug);
  const membership = await roomRepository.getMembershipForUser(parsed.userId, room.id);

  if (!membership) {
    throw new Error("That player has no recorded membership for this room.");
  }

  if (membership.isActive) {
    throw new Error("That player is already active in this room.");
  }

  const restoredMembership = await roomRepository.updateMembershipState({
    roomId: room.id,
    userId: parsed.userId,
    isActive: true,
    removedAt: null,
  });

  const user = await userRepository.getUserById(parsed.userId);

  if (user && !user.lastRoomId) {
    await userRepository.updateLastRoom(parsed.userId, room.id);
  }

  await auditRepository.create({
    actorUserId,
    action: "ROOM_MEMBER_RESTORED",
    entityType: "RoomMembership",
    entityId: restoredMembership.id,
    payload: {
      roomSlug: room.slug,
      targetUserId: restoredMembership.userId,
      targetEmail: restoredMembership.user.email ?? null,
      restoredJoinedAt: restoredMembership.joinedAt.toISOString(),
    },
  });

  return restoredMembership;
}

export async function recalculateLeaderboard(actorUserId: string, roomSlug: string) {
  const room = await getRoomOrThrow(roomSlug);
  const leaderboard = await getLeaderboardRows(room.id);

  await auditRepository.create({
    actorUserId,
    action: "LEADERBOARD_RECALCULATED",
    entityType: "Leaderboard",
    entityId: room.id,
    payload: {
      roomSlug: room.slug,
      rowCount: leaderboard.length,
    },
  });

  return leaderboard;
}

export async function getAdminOverviewData() {
  await ensureSystemReady();

  const [config, audits, rooms] = await Promise.all([
    getAppConfigOrThrow(),
    auditRepository.listRecent(),
    roomRepository.listRooms(),
  ]);

  return {
    config,
    audits,
    rooms: rooms.map((room) => ({
      id: room.id,
      slug: room.slug,
      name: room.name,
      code: room.code,
      isActive: room.isActive,
      allowlistEnabled: room.allowlistEnabled,
      memberCount: room._count.memberships,
      inviteCount: room._count.allowedEmails,
    })),
  };
}

export async function getAdminRoomOverviewData(roomSlug: string) {
  await ensureSystemReady();

  const room = await getRoomOrThrow(roomSlug);

  const [config, allowlist, audits, memberships, leaderboard] = await Promise.all([
    getAppConfigOrThrow(),
    configRepository.listAllowedEmails(room.id),
    auditRepository.listRecent(),
    roomRepository.listMemberships(room.id, { includeInactive: true }),
    getLeaderboardRows(room.id),
  ]);

  const activeMembers = memberships
    .filter((membership) => membership.isActive)
    .map(toAdminRoomMemberView);
  const removedMembers = memberships
    .filter((membership) => !membership.isActive)
    .sort(
      (left, right) =>
        (right.removedAt?.getTime() ?? 0) - (left.removedAt?.getTime() ?? 0),
    )
    .map(toAdminRoomMemberView);

  return {
    room,
    config,
    allowlist,
    audits,
    membershipCount: activeMembers.length,
    removedMemberCount: removedMembers.length,
    activeMembers,
    removedMembers,
    leaderboard: leaderboard.slice(0, 5),
  };
}

export async function getAdminMatchesData(roomSlug: string) {
  await ensureSystemReady();
  await getRoomOrThrow(roomSlug);
  const now = new Date();
  const matches = await matchRepository.listMatches();
  return sortAdminMatches(matches, now);
}

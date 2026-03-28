import { MatchStage, MatchStatus } from "@prisma/client";

import seedData from "../../../prisma/seed-data/ipl-2026.json";
import { calculateCutoffTime, parseIstDateTimeInput } from "@/lib/time";
import { slugifyRoomName } from "@/lib/rooms";
import {
  adminAllowlistRemoveSchema,
  adminAllowlistToggleSchema,
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
    roomRepository.listMemberships(room.id),
    getLeaderboardRows(room.id),
  ]);

  return {
    room,
    config,
    allowlist,
    audits,
    membershipCount: memberships.length,
    leaderboard: leaderboard.slice(0, 5),
  };
}

export async function getAdminMatchesData(roomSlug: string) {
  await ensureSystemReady();
  await getRoomOrThrow(roomSlug);
  return matchRepository.listMatches();
}

import { MatchStage, MatchStatus, UserRole } from "@prisma/client";
import { vi } from "vitest";

import { getIntegrationModules, resetIntegrationDatabase } from "@/tests/helpers/integration";

const describeIfDb = process.env.TEST_DATABASE_URL ? describe : describe.skip;

describeIfDb("room picks visibility", () => {
  let db: Awaited<ReturnType<typeof getIntegrationModules>>["db"];
  let ensureSystemReady: Awaited<ReturnType<typeof getIntegrationModules>>["ensureSystemReady"];
  let getRoomPicksView: Awaited<
    ReturnType<typeof getIntegrationModules>
  >["getRoomPicksView"];

  beforeAll(async () => {
    ({ db, ensureSystemReady, getRoomPicksView } = await getIntegrationModules());
    await db.$connect();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-29T04:00:00.000Z"));
  });

  afterAll(async () => {
    vi.useRealTimers();
    await db.$disconnect();
  });

  beforeEach(async () => {
    await resetIntegrationDatabase(db);
    await ensureSystemReady();
  });

  it("groups today's room picks first and earlier visible matches below them", async () => {
    const room = await db.room.findFirstOrThrow();
    const viewer = await db.user.create({
      data: {
        email: "viewer@example.com",
        role: UserRole.USER,
      },
    });
    const activePlayer = await db.user.create({
      data: {
        email: "active@example.com",
        role: UserRole.USER,
      },
    });
    const removedPlayer = await db.user.create({
      data: {
        email: "removed@example.com",
        role: UserRole.USER,
      },
    });

    const [teamA, teamB, teamC, teamD] = await Promise.all([
      db.team.create({ data: { shortCode: "AAA", name: "Alpha" } }),
      db.team.create({ data: { shortCode: "BBB", name: "Beta" } }),
      db.team.create({ data: { shortCode: "CCC", name: "Gamma" } }),
      db.team.create({ data: { shortCode: "DDD", name: "Delta" } }),
    ]);

    const todayMatch = await db.match.create({
      data: {
        season: 2026,
        stage: MatchStage.LEAGUE,
        teamAId: teamA.id,
        teamBId: teamB.id,
        startTimeUtc: new Date("2026-03-29T14:00:00.000Z"),
        cutoffTimeUtc: new Date("2026-03-29T13:00:00.000Z"),
        status: MatchStatus.SCHEDULED,
      },
    });
    const previousMatch = await db.match.create({
      data: {
        season: 2026,
        stage: MatchStage.LEAGUE,
        teamAId: teamC.id,
        teamBId: teamD.id,
        startTimeUtc: new Date("2026-03-28T14:00:00.000Z"),
        cutoffTimeUtc: new Date("2026-03-28T13:00:00.000Z"),
        status: MatchStatus.COMPLETED,
        winningTeamId: teamC.id,
        settledAt: new Date("2026-03-28T18:00:00.000Z"),
      },
    });
    await db.match.create({
      data: {
        season: 2026,
        stage: MatchStage.LEAGUE,
        teamAId: teamC.id,
        teamBId: teamD.id,
        startTimeUtc: new Date("2026-03-30T14:00:00.000Z"),
        cutoffTimeUtc: new Date("2026-03-30T13:00:00.000Z"),
        status: MatchStatus.SCHEDULED,
      },
    });

    await db.roomMembership.createMany({
      data: [
        {
          roomId: room.id,
          userId: viewer.id,
          joinedAt: new Date("2026-03-20T10:00:00.000Z"),
        },
        {
          roomId: room.id,
          userId: activePlayer.id,
          joinedAt: new Date("2026-03-20T10:00:00.000Z"),
        },
        {
          roomId: room.id,
          userId: removedPlayer.id,
          joinedAt: new Date("2026-03-20T10:00:00.000Z"),
          isActive: false,
          removedAt: new Date("2026-03-28T10:00:00.000Z"),
        },
      ],
    });

    await db.prediction.createMany({
      data: [
        {
          roomId: room.id,
          userId: viewer.id,
          matchId: todayMatch.id,
          predictedTeamId: teamA.id,
          submittedAt: new Date("2026-03-29T03:00:00.000Z"),
        },
        {
          roomId: room.id,
          userId: activePlayer.id,
          matchId: todayMatch.id,
          predictedTeamId: teamB.id,
          submittedAt: new Date("2026-03-29T03:10:00.000Z"),
        },
        {
          roomId: room.id,
          userId: activePlayer.id,
          matchId: previousMatch.id,
          predictedTeamId: teamC.id,
          submittedAt: new Date("2026-03-28T03:10:00.000Z"),
        },
        {
          roomId: room.id,
          userId: removedPlayer.id,
          matchId: todayMatch.id,
          predictedTeamId: teamA.id,
          submittedAt: new Date("2026-03-29T03:15:00.000Z"),
        },
      ],
    });

    const view = await getRoomPicksView(viewer.id, room.slug);

    expect(view.todayMatches).toHaveLength(1);
    expect(view.pastMatches).toHaveLength(1);
    expect(view.todayMatches[0]?.showRoomPicksDisclosure).toBe(true);
    expect(view.todayMatches[0]?.individualPicks.map((pick) => pick.name)).toEqual([
      "active@example.com",
      "viewer@example.com",
    ]);
    expect(view.pastMatches[0]?.id).toBe(previousMatch.id);
    expect(view.pastMatches[0]?.individualPicks.map((pick) => pick.name)).toEqual([
      "active@example.com",
    ]);
  });

  it("keeps previous visible matches ordered newest first", async () => {
    const room = await db.room.findFirstOrThrow();
    const viewer = await db.user.create({
      data: {
        email: "viewer2@example.com",
        role: UserRole.USER,
      },
    });

    const [teamA, teamB] = await Promise.all([
      db.team.create({ data: { shortCode: "EEE", name: "Echo" } }),
      db.team.create({ data: { shortCode: "FFF", name: "Foxtrot" } }),
    ]);

    await db.roomMembership.create({
      data: {
        roomId: room.id,
        userId: viewer.id,
        joinedAt: new Date("2026-03-20T10:00:00.000Z"),
      },
    });

    const olderMatch = await db.match.create({
      data: {
        season: 2026,
        stage: MatchStage.LEAGUE,
        teamAId: teamA.id,
        teamBId: teamB.id,
        startTimeUtc: new Date("2026-03-25T14:00:00.000Z"),
        cutoffTimeUtc: new Date("2026-03-25T13:00:00.000Z"),
        status: MatchStatus.COMPLETED,
        winningTeamId: teamA.id,
        settledAt: new Date("2026-03-25T18:00:00.000Z"),
      },
    });
    const newerMatch = await db.match.create({
      data: {
        season: 2026,
        stage: MatchStage.LEAGUE,
        teamAId: teamA.id,
        teamBId: teamB.id,
        startTimeUtc: new Date("2026-03-28T14:00:00.000Z"),
        cutoffTimeUtc: new Date("2026-03-28T13:00:00.000Z"),
        status: MatchStatus.COMPLETED,
        winningTeamId: teamB.id,
        settledAt: new Date("2026-03-28T18:00:00.000Z"),
      },
    });

    const view = await getRoomPicksView(viewer.id, room.slug);

    expect(view.pastMatches.map((match) => match.id)).toEqual([
      newerMatch.id,
      olderMatch.id,
    ]);
  });
});

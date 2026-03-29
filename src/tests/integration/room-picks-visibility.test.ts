import { MatchStage, MatchStatus, UserRole } from "@prisma/client";
import { vi } from "vitest";

import { getIntegrationModules, resetIntegrationDatabase } from "@/tests/helpers/integration";

const describeIfDb = process.env.TEST_DATABASE_URL ? describe : describe.skip;

describeIfDb("room picks visibility", () => {
  let db: Awaited<ReturnType<typeof getIntegrationModules>>["db"];
  let ensureSystemReady: Awaited<ReturnType<typeof getIntegrationModules>>["ensureSystemReady"];
  let getTodayRoomPicksView: Awaited<
    ReturnType<typeof getIntegrationModules>
  >["getTodayRoomPicksView"];

  beforeAll(async () => {
    ({ db, ensureSystemReady, getTodayRoomPicksView } = await getIntegrationModules());
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

  it("shows only today's active room picks", async () => {
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
          userId: removedPlayer.id,
          matchId: todayMatch.id,
          predictedTeamId: teamA.id,
          submittedAt: new Date("2026-03-29T03:15:00.000Z"),
        },
      ],
    });

    const view = await getTodayRoomPicksView(viewer.id, room.slug);

    expect(view.matches).toHaveLength(1);
    expect(view.matches[0]?.showRoomPicksDisclosure).toBe(true);
    expect(view.matches[0]?.individualPicks.map((pick) => pick.name)).toEqual([
      "active@example.com",
      "viewer@example.com",
    ]);
  });
});

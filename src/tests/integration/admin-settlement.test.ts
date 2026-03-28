import { MatchStage, MatchStatus, UserRole } from "@prisma/client";

import { getIntegrationModules, resetIntegrationDatabase } from "@/tests/helpers/integration";

const describeIfDb = process.env.TEST_DATABASE_URL ? describe : describe.skip;

describeIfDb("admin settlement updates leaderboard", () => {
  let db: Awaited<ReturnType<typeof getIntegrationModules>>["db"];
  let ensureSystemReady: Awaited<ReturnType<typeof getIntegrationModules>>["ensureSystemReady"];
  let getLeaderboardRows: Awaited<
    ReturnType<typeof getIntegrationModules>
  >["getLeaderboardRows"];
  let settleFixtureResult: Awaited<
    ReturnType<typeof getIntegrationModules>
  >["settleFixtureResult"];

  beforeAll(async () => {
    ({ db, ensureSystemReady, getLeaderboardRows, settleFixtureResult } =
      await getIntegrationModules());
    await db.$connect();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  beforeEach(async () => {
    await resetIntegrationDatabase(db);
    await ensureSystemReady();
  });

  it("awards a point to correct predictions as soon as a match is settled", async () => {
    const room = await db.room.findFirstOrThrow();
    const admin = await db.user.create({
      data: {
        email: "admin@example.com",
        role: UserRole.ADMIN,
      },
    });
    const player = await db.user.create({
      data: {
        email: "player@example.com",
        role: UserRole.USER,
      },
    });
    const [teamA, teamB] = await Promise.all([
      db.team.create({ data: { shortCode: "AAA", name: "Alpha" } }),
      db.team.create({ data: { shortCode: "BBB", name: "Beta" } }),
    ]);
    const match = await db.match.create({
      data: {
        season: 2026,
        stage: MatchStage.LEAGUE,
        teamAId: teamA.id,
        teamBId: teamB.id,
        startTimeUtc: new Date("2026-03-28T14:00:00.000Z"),
        cutoffTimeUtc: new Date("2026-03-28T13:00:00.000Z"),
        status: MatchStatus.SCHEDULED,
      },
    });

    await db.roomMembership.createMany({
      data: [
        {
          roomId: room.id,
          userId: admin.id,
          joinedAt: new Date("2026-03-28T10:00:00.000Z"),
        },
        {
          roomId: room.id,
          userId: player.id,
          joinedAt: new Date("2026-03-28T10:00:00.000Z"),
        },
      ],
    });

    await db.prediction.create({
      data: {
        roomId: room.id,
        userId: player.id,
        matchId: match.id,
        predictedTeamId: teamA.id,
        submittedAt: new Date("2026-03-28T12:00:00.000Z"),
      },
    });

    const before = await getLeaderboardRows(room.id);
    expect(before.find((row) => row.userId === player.id)?.points).toBe(0);

    await settleFixtureResult(admin.id, {
      matchId: match.id,
      status: MatchStatus.COMPLETED,
      winningTeamId: teamA.id,
    });

    const after = await getLeaderboardRows(room.id);
    const playerRow = after.find((row) => row.userId === player.id);

    expect(playerRow).toMatchObject({
      points: 1,
      correct: 1,
      wrong: 0,
      missed: 0,
    });
    expect(playerRow?.accuracy).toBe(1);
  });
});

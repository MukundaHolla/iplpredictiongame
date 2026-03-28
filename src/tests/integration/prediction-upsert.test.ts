import { MatchStage, MatchStatus, UserRole } from "@prisma/client";

import { getIntegrationModules, resetIntegrationDatabase } from "@/tests/helpers/integration";

const describeIfDb = process.env.TEST_DATABASE_URL ? describe : describe.skip;

describeIfDb("prediction upsert uniqueness", () => {
  let db: Awaited<ReturnType<typeof getIntegrationModules>>["db"];
  let ensureSystemReady: Awaited<ReturnType<typeof getIntegrationModules>>["ensureSystemReady"];
  let predictionRepository: Awaited<
    ReturnType<typeof getIntegrationModules>
  >["predictionRepository"];

  beforeAll(async () => {
    ({ db, ensureSystemReady, predictionRepository } = await getIntegrationModules());
    await db.$connect();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  beforeEach(async () => {
    await resetIntegrationDatabase(db);
    await ensureSystemReady();
  });

  it("keeps a single prediction row for the same room, user, and match", async () => {
    const room = await db.room.findFirstOrThrow();
    const user = await db.user.create({
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

    await db.roomMembership.create({
      data: {
        roomId: room.id,
        userId: user.id,
        joinedAt: new Date("2026-03-28T10:00:00.000Z"),
      },
    });

    await predictionRepository.upsertPrediction({
      roomId: room.id,
      userId: user.id,
      matchId: match.id,
      predictedTeamId: teamA.id,
      submittedAt: new Date("2026-03-28T12:00:00.000Z"),
      isLockedSnapshot: false,
    });

    await predictionRepository.upsertPrediction({
      roomId: room.id,
      userId: user.id,
      matchId: match.id,
      predictedTeamId: teamB.id,
      submittedAt: new Date("2026-03-28T12:30:00.000Z"),
      isLockedSnapshot: false,
    });

    const predictions = await db.prediction.findMany();

    expect(predictions).toHaveLength(1);
    expect(predictions[0]?.predictedTeamId).toBe(teamB.id);
  });
});

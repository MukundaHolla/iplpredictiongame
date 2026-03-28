import { PrismaClient } from "@prisma/client";
import { vi } from "vitest";

export async function getIntegrationModules() {
  const url = process.env.TEST_DATABASE_URL;

  if (!url) {
    throw new Error("TEST_DATABASE_URL is not configured.");
  }

  vi.resetModules();
  process.env.DATABASE_URL = url;
  process.env.DIRECT_URL = process.env.TEST_DIRECT_URL ?? url;
  process.env.PRIVATE_ROOM_CODE = process.env.PRIVATE_ROOM_CODE ?? "MYIPL2026";
  process.env.DEFAULT_CUTOFF_MINUTES = process.env.DEFAULT_CUTOFF_MINUTES ?? "60";
  process.env.ALLOWLIST_ENABLED = process.env.ALLOWLIST_ENABLED ?? "false";
  process.env.ADMIN_EMAILS = process.env.ADMIN_EMAILS ?? "admin@example.com";

  const [{ db }, systemService, leaderboardService, predictionRepo, adminService] =
    await Promise.all([
      import("@/lib/db"),
      import("@/server/services/system-service"),
      import("@/server/services/leaderboard-service"),
      import("@/server/repositories/prediction-repository"),
      import("@/server/services/admin-service"),
    ]);

  return {
    db: db as PrismaClient,
    ensureSystemReady: systemService.ensureSystemReady,
    getLeaderboardRows: leaderboardService.getLeaderboardRows,
    predictionRepository: predictionRepo.predictionRepository,
    settleFixtureResult: adminService.settleFixtureResult,
  };
}

export async function resetIntegrationDatabase(db: PrismaClient) {
  await db.verificationToken.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.prediction.deleteMany();
  await db.auditLog.deleteMany();
  await db.roomMembership.deleteMany();
  await db.match.deleteMany();
  await db.team.deleteMany();
  await db.allowedEmail.deleteMany();
  await db.room.deleteMany();
  await db.appConfig.deleteMany();
  await db.user.deleteMany();
}

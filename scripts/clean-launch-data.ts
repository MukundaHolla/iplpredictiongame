import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const CONFIRMATION_TOKEN = "YES_DELETE_LAUNCH_DATA";

const db = new PrismaClient();

function formatSummary(summary: Record<string, number>) {
  return Object.entries(summary)
    .map(([label, value]) => `${label}=${value}`)
    .join(", ");
}

async function getCounts() {
  const [users, accounts, sessions, memberships, predictions, auditLogs, verificationTokens] =
    await Promise.all([
      db.user.count(),
      db.account.count(),
      db.session.count(),
      db.roomMembership.count(),
      db.prediction.count(),
      db.auditLog.count(),
      db.verificationToken.count(),
    ]);

  return {
    users,
    accounts,
    sessions,
    memberships,
    predictions,
    auditLogs,
    verificationTokens,
  };
}

async function main() {
  if (process.env.CONFIRM_LAUNCH_CLEAN !== CONFIRMATION_TOKEN) {
    throw new Error(
      [
        "Refusing to delete launch data without confirmation.",
        `Re-run with CONFIRM_LAUNCH_CLEAN=${CONFIRMATION_TOKEN} pnpm db:launch-clean`,
        "This script keeps Team, Match, Room, AppConfig, and AllowedEmail data intact.",
      ].join(" "),
    );
  }

  const before = await getCounts();
  console.log(`Before cleanup: ${formatSummary(before)}`);

  await db.$transaction([
    db.auditLog.deleteMany({}),
    db.verificationToken.deleteMany({}),
    db.user.deleteMany({}),
  ]);

  const after = await getCounts();
  console.log(`After cleanup: ${formatSummary(after)}`);
  console.log(
    "Launch data cleanup complete. Next run `pnpm db:deploy` and `pnpm seed:ipl` against production.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });

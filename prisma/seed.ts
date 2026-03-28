import "dotenv/config";

import {
  MatchStage,
  MatchStatus,
  PredictionsRevealMode,
  UserRole,
} from "@prisma/client";

import seedData from "./seed-data/ipl-2026.json";
import { APP_CONFIG_ID, APP_NAME, SINGLE_ROOM_NAME } from "../src/lib/constants";
import { db } from "../src/lib/db";
import {
  getAdminEmails,
  getAllowlistEnabledDefault,
  getDefaultCutoffMinutes,
  getPrivateRoomCode,
} from "../src/lib/env";
import { slugifyRoomName } from "../src/lib/rooms";
import { calculateCutoffTime } from "../src/lib/time";

async function main() {
  const privateRoomCode = getPrivateRoomCode();
  const defaultCutoffMinutes = getDefaultCutoffMinutes();
  const adminEmails = [...getAdminEmails()];
  const defaultRoomName = `${APP_NAME} · ${SINGLE_ROOM_NAME}`;

  const existingRoom = await db.room.findFirst({
    orderBy: { createdAt: "asc" },
  });

  const room =
    existingRoom ??
    (await db.room.create({
      data: {
        code: privateRoomCode,
        slug: slugifyRoomName(SINGLE_ROOM_NAME),
        name: defaultRoomName,
        isActive: true,
        allowlistEnabled: getAllowlistEnabledDefault(),
      },
    }));

  await db.appConfig.upsert({
    where: { id: APP_CONFIG_ID },
    update: {
      defaultCutoffMinutes,
      predictionsRevealMode: PredictionsRevealMode.AFTER_CUTOFF,
    },
    create: {
      id: APP_CONFIG_ID,
      defaultCutoffMinutes,
      allowlistEnabled: false,
      predictionsRevealMode: PredictionsRevealMode.AFTER_CUTOFF,
    },
  });

  for (const email of adminEmails) {
    await db.allowedEmail.upsert({
      where: {
        roomId_email: {
          roomId: room.id,
          email,
        },
      },
      update: { isActive: true },
      create: {
        roomId: room.id,
        email,
        isActive: true,
      },
    });
  }

  if (adminEmails.length > 0) {
    await db.user.updateMany({
      where: {
        email: { in: adminEmails },
      },
      data: {
        role: UserRole.ADMIN,
      },
    });
  }

  const teamIds = new Map<string, string>();

  for (const team of seedData.teams) {
    const createdTeam = await db.team.upsert({
      where: { shortCode: team.shortCode },
      update: team,
      create: team,
    });

    teamIds.set(team.shortCode, createdTeam.id);
  }

  for (const fixture of seedData.matches) {
    const startTimeUtc = new Date(fixture.startTimeUtc);
    const stage = fixture.stage as MatchStage;

    await db.match.upsert({
      where: { externalRef: fixture.externalRef },
      update: {
        season: fixture.season,
        matchNumber: fixture.matchNumber,
        stage,
        teamAId: teamIds.get(fixture.teamAShortCode)!,
        teamBId: teamIds.get(fixture.teamBShortCode)!,
        venue: fixture.venue,
        city: fixture.city,
        startTimeUtc,
        cutoffTimeUtc: calculateCutoffTime(startTimeUtc, defaultCutoffMinutes),
      },
      create: {
        externalRef: fixture.externalRef,
        season: fixture.season,
        matchNumber: fixture.matchNumber,
        stage,
        teamAId: teamIds.get(fixture.teamAShortCode)!,
        teamBId: teamIds.get(fixture.teamBShortCode)!,
        venue: fixture.venue,
        city: fixture.city,
        startTimeUtc,
        cutoffTimeUtc: calculateCutoffTime(startTimeUtc, defaultCutoffMinutes),
        status: MatchStatus.SCHEDULED,
      },
    });
  }

  console.log(
    `Seeded room ${room.code}, ${seedData.teams.length} teams, and ${seedData.matches.length} IPL 2026 league fixtures.`,
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

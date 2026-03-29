import { UserRole } from "@prisma/client";

import { getIntegrationModules, resetIntegrationDatabase } from "@/tests/helpers/integration";

const describeIfDb = process.env.TEST_DATABASE_URL ? describe : describe.skip;

describeIfDb("room membership management", () => {
  let db: Awaited<ReturnType<typeof getIntegrationModules>>["db"];
  let ensureSystemReady: Awaited<ReturnType<typeof getIntegrationModules>>["ensureSystemReady"];
  let getLeaderboardRows: Awaited<
    ReturnType<typeof getIntegrationModules>
  >["getLeaderboardRows"];
  let removeRoomMember: Awaited<
    ReturnType<typeof getIntegrationModules>
  >["removeRoomMember"];
  let restoreRoomMember: Awaited<
    ReturnType<typeof getIntegrationModules>
  >["restoreRoomMember"];

  beforeAll(async () => {
    ({ db, ensureSystemReady, getLeaderboardRows, removeRoomMember, restoreRoomMember } =
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

  it("removes a player from the room and restores them with the same join order", async () => {
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

    await db.roomMembership.createMany({
      data: [
        {
          roomId: room.id,
          userId: player.id,
          joinedAt: new Date("2026-03-20T10:00:00.000Z"),
        },
        {
          roomId: room.id,
          userId: admin.id,
          joinedAt: new Date("2026-03-21T10:00:00.000Z"),
        },
      ],
    });

    const beforeRemoval = await getLeaderboardRows(room.id);
    expect(beforeRemoval.map((row) => row.userId)).toEqual([player.id, admin.id]);

    await removeRoomMember(admin.id, {
      roomSlug: room.slug,
      userId: player.id,
    });

    const afterRemoval = await getLeaderboardRows(room.id);
    expect(afterRemoval.map((row) => row.userId)).toEqual([admin.id]);

    const removedMembership = await db.roomMembership.findUniqueOrThrow({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId: player.id,
        },
      },
    });

    expect(removedMembership.isActive).toBe(false);
    expect(removedMembership.removedAt).not.toBeNull();

    await restoreRoomMember(admin.id, {
      roomSlug: room.slug,
      userId: player.id,
    });

    const afterRestore = await getLeaderboardRows(room.id);
    expect(afterRestore.map((row) => row.userId)).toEqual([player.id, admin.id]);

    const restoredMembership = await db.roomMembership.findUniqueOrThrow({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId: player.id,
        },
      },
    });

    expect(restoredMembership.isActive).toBe(true);
    expect(restoredMembership.removedAt).toBeNull();
    expect(restoredMembership.joinedAt.toISOString()).toBe("2026-03-20T10:00:00.000Z");
  });
});

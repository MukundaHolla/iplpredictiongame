import { db } from "@/lib/db";

export const roomRepository = {
  async syncSingletonRoom(input: { code: string; name: string }) {
    const existingRoom = await db.room.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (existingRoom) {
      return db.room.update({
        where: { id: existingRoom.id },
        data: {
          code: input.code,
          name: input.name,
          isActive: true,
        },
      });
    }

    return db.room.create({
      data: {
        code: input.code,
        name: input.name,
        isActive: true,
      },
    });
  },

  getActiveRoom() {
    return db.room.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
  },

  getMembershipByUserId(userId: string) {
    return db.roomMembership.findFirst({
      where: { userId },
      include: {
        room: true,
      },
      orderBy: { joinedAt: "asc" },
    });
  },

  async joinRoom(roomId: string, userId: string) {
    return db.roomMembership.upsert({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
      update: {},
      create: {
        roomId,
        userId,
      },
      include: {
        room: true,
        user: true,
      },
    });
  },

  listMemberships(roomId: string) {
    return db.roomMembership.findMany({
      where: { roomId },
      include: {
        user: true,
      },
      orderBy: { joinedAt: "asc" },
    });
  },
};

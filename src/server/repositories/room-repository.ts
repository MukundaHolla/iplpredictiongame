import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export const roomRepository = {
  async ensureDefaultRoom(input: {
    code: string;
    slug: string;
    name: string;
    allowlistEnabled: boolean;
  }) {
    const existingRoom = await db.room.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (existingRoom) {
      return existingRoom;
    }

    try {
      return await db.room.create({
        data: {
          code: input.code,
          slug: input.slug,
          name: input.name,
          isActive: true,
          allowlistEnabled: input.allowlistEnabled,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const concurrentRoom = await db.room.findFirst({
          orderBy: { createdAt: "asc" },
        });

        if (concurrentRoom) {
          return concurrentRoom;
        }
      }

      throw error;
    }
  },

  listRooms() {
    return db.room.findMany({
      orderBy: [{ createdAt: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            memberships: true,
            predictions: true,
            allowedEmails: true,
          },
        },
      },
    });
  },

  listRoomsByIds(roomIds: string[]) {
    if (roomIds.length === 0) {
      return Promise.resolve([]);
    }

    return db.room.findMany({
      where: {
        id: {
          in: roomIds,
        },
      },
      orderBy: [{ createdAt: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            memberships: true,
            predictions: true,
            allowedEmails: true,
          },
        },
      },
    });
  },

  getRoomById(roomId: string) {
    return db.room.findUnique({
      where: { id: roomId },
    });
  },

  getRoomBySlug(slug: string) {
    return db.room.findUnique({
      where: { slug },
    });
  },

  getRoomByCode(code: string) {
    return db.room.findFirst({
      where: {
        code: {
          equals: code,
          mode: "insensitive",
        },
      },
    });
  },

  getUserMemberships(userId: string) {
    return db.roomMembership.findMany({
      where: { userId },
      include: {
        room: true,
      },
      orderBy: [{ joinedAt: "asc" }, { room: { name: "asc" } }],
    });
  },

  getMembershipForUser(userId: string, roomId: string) {
    return db.roomMembership.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
      include: {
        room: true,
        user: true,
      },
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

  createRoom(input: {
    code: string;
    slug: string;
    name: string;
    isActive: boolean;
    allowlistEnabled: boolean;
  }) {
    return db.room.create({
      data: input,
    });
  },

  updateRoom(input: {
    roomId: string;
    code: string;
    slug: string;
    name: string;
    isActive: boolean;
    allowlistEnabled: boolean;
  }) {
    return db.room.update({
      where: { id: input.roomId },
      data: {
        code: input.code,
        slug: input.slug,
        name: input.name,
        isActive: input.isActive,
        allowlistEnabled: input.allowlistEnabled,
      },
    });
  },
};

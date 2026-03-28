import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export const auditRepository = {
  create(input: {
    actorUserId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    payload?: Prisma.InputJsonValue | null;
  }) {
    return db.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        payload: input.payload ?? undefined,
      },
    });
  },

  listRecent(limit = 20) {
    return db.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        actorUser: true,
      },
    });
  },
};

import { Prisma, PredictionsRevealMode } from "@prisma/client";

import { APP_CONFIG_ID } from "@/lib/constants";
import { db } from "@/lib/db";

export const configRepository = {
  upsertDefaults(input: { defaultCutoffMinutes: number }) {
    return db.appConfig
      .upsert({
        where: { id: APP_CONFIG_ID },
        update: {},
        create: {
          id: APP_CONFIG_ID,
          defaultCutoffMinutes: input.defaultCutoffMinutes,
          allowlistEnabled: false,
          predictionsRevealMode: PredictionsRevealMode.AFTER_CUTOFF,
        },
      })
      .catch(async (error) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          const existing = await db.appConfig.findUnique({
            where: { id: APP_CONFIG_ID },
          });

          if (existing) {
            return existing;
          }
        }

        throw error;
      });
  },

  getAppConfig() {
    return db.appConfig.findUnique({
      where: { id: APP_CONFIG_ID },
    });
  },

  updateAppConfig(input: {
    defaultCutoffMinutes: number;
    predictionsRevealMode: PredictionsRevealMode;
  }) {
    return db.appConfig.update({
      where: { id: APP_CONFIG_ID },
      data: {
        defaultCutoffMinutes: input.defaultCutoffMinutes,
        predictionsRevealMode: input.predictionsRevealMode,
      },
    });
  },

  listAllowedEmails(roomId: string) {
    return db.allowedEmail.findMany({
      where: { roomId },
      orderBy: { email: "asc" },
    });
  },

  upsertAllowedEmail(roomId: string, email: string, isActive: boolean) {
    return db.allowedEmail
      .upsert({
        where: {
          roomId_email: {
            roomId,
            email,
          },
        },
        update: { isActive },
        create: { roomId, email, isActive },
      })
      .catch(async (error) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          const existing = await db.allowedEmail.findUnique({
            where: {
              roomId_email: {
                roomId,
                email,
              },
            },
          });

          if (existing) {
            return existing;
          }
        }

        throw error;
      });
  },

  updateAllowedEmail(id: string, isActive: boolean) {
    return db.allowedEmail.update({
      where: { id },
      data: { isActive },
    });
  },

  removeAllowedEmail(id: string) {
    return db.allowedEmail.delete({
      where: { id },
    });
  },

  findAllowedEmail(roomId: string, email: string) {
    return db.allowedEmail.findUnique({
      where: {
        roomId_email: {
          roomId,
          email,
        },
      },
    });
  },
};

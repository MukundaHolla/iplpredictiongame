import { PredictionsRevealMode } from "@prisma/client";

import { APP_CONFIG_ID } from "@/lib/constants";
import { db } from "@/lib/db";

export const configRepository = {
  upsertDefaults(input: { defaultCutoffMinutes: number; allowlistEnabled: boolean }) {
    return db.appConfig.upsert({
      where: { id: APP_CONFIG_ID },
      update: {},
      create: {
        id: APP_CONFIG_ID,
        defaultCutoffMinutes: input.defaultCutoffMinutes,
        allowlistEnabled: input.allowlistEnabled,
        predictionsRevealMode: PredictionsRevealMode.AFTER_CUTOFF,
      },
    });
  },

  getAppConfig() {
    return db.appConfig.findUnique({
      where: { id: APP_CONFIG_ID },
    });
  },

  updateAppConfig(input: {
    defaultCutoffMinutes: number;
    allowlistEnabled: boolean;
    predictionsRevealMode: PredictionsRevealMode;
  }) {
    return db.appConfig.update({
      where: { id: APP_CONFIG_ID },
      data: input,
    });
  },

  listAllowedEmails() {
    return db.allowedEmail.findMany({
      orderBy: { email: "asc" },
    });
  },

  upsertAllowedEmail(email: string, isActive: boolean) {
    return db.allowedEmail.upsert({
      where: { email },
      update: { isActive },
      create: { email, isActive },
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

  findAllowedEmail(email: string) {
    return db.allowedEmail.findUnique({
      where: { email },
    });
  },
};

import { UserRole } from "@prisma/client";

import { db } from "@/lib/db";

export const userRepository = {
  getUserById(userId: string) {
    return db.user.findUnique({
      where: { id: userId },
    });
  },

  syncAdminRoles(adminEmails: string[]) {
    if (adminEmails.length === 0) {
      return Promise.resolve({ count: 0 });
    }

    return db.user.updateMany({
      where: {
        email: { in: adminEmails },
      },
      data: {
        role: UserRole.ADMIN,
      },
    });
  },
};

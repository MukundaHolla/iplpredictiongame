import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getActiveRoom: vi.fn(),
  getMembershipByUserId: vi.fn(),
  joinRoom: vi.fn(),
  getAppConfig: vi.fn(),
  findAllowedEmail: vi.fn(),
  getUserById: vi.fn(),
  createAudit: vi.fn(),
  ensureSystemReady: vi.fn(),
}));

vi.mock("@/server/repositories/room-repository", () => ({
  roomRepository: {
    getActiveRoom: mocks.getActiveRoom,
    getMembershipByUserId: mocks.getMembershipByUserId,
    joinRoom: mocks.joinRoom,
  },
}));

vi.mock("@/server/repositories/config-repository", () => ({
  configRepository: {
    getAppConfig: mocks.getAppConfig,
    findAllowedEmail: mocks.findAllowedEmail,
  },
}));

vi.mock("@/server/repositories/user-repository", () => ({
  userRepository: {
    getUserById: mocks.getUserById,
  },
}));

vi.mock("@/server/repositories/audit-repository", () => ({
  auditRepository: {
    create: mocks.createAudit,
  },
}));

vi.mock("@/server/services/system-service", () => ({
  ensureSystemReady: mocks.ensureSystemReady,
}));

import { joinPrivateRoom } from "@/server/services/membership-service";

describe("joinPrivateRoom", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getActiveRoom.mockResolvedValue({
      id: "room_1",
      code: "MYIPL2026",
      name: "Friends Room",
      isActive: true,
    });
    mocks.getMembershipByUserId.mockResolvedValue(null);
    mocks.getAppConfig.mockResolvedValue({
      id: "singleton",
      allowlistEnabled: false,
      defaultCutoffMinutes: 60,
      predictionsRevealMode: "AFTER_CUTOFF",
    });
    mocks.getUserById.mockResolvedValue({
      id: "user_1",
      email: "friend@example.com",
      name: "Friend",
    });
    mocks.joinRoom.mockResolvedValue({
      id: "membership_1",
      room: { id: "room_1" },
      user: { id: "user_1" },
    });
  });

  it("joins successfully when the code matches and allowlist is off", async () => {
    await joinPrivateRoom("user_1", "MYIPL2026");

    expect(mocks.joinRoom).toHaveBeenCalledWith("room_1", "user_1");
    expect(mocks.createAudit).toHaveBeenCalledTimes(1);
  });

  it("blocks join when allowlist is enabled and the email is not invited", async () => {
    mocks.getAppConfig.mockResolvedValue({
      id: "singleton",
      allowlistEnabled: true,
      defaultCutoffMinutes: 60,
      predictionsRevealMode: "AFTER_CUTOFF",
    });
    mocks.findAllowedEmail.mockResolvedValue(null);

    await expect(joinPrivateRoom("user_1", "MYIPL2026")).rejects.toThrow(
      "not on the invite list",
    );
  });
});

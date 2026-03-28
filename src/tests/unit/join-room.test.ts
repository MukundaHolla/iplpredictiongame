import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserById: vi.fn(),
  getRoomByCode: vi.fn(),
  joinRoom: vi.fn(),
  updateLastRoom: vi.fn(),
  findAllowedEmail: vi.fn(),
  createAudit: vi.fn(),
  ensureSystemReady: vi.fn(),
}));

vi.mock("@/server/repositories/room-repository", () => ({
  roomRepository: {
    getRoomByCode: mocks.getRoomByCode,
    joinRoom: mocks.joinRoom,
  },
}));

vi.mock("@/server/repositories/config-repository", () => ({
  configRepository: {
    findAllowedEmail: mocks.findAllowedEmail,
  },
}));

vi.mock("@/server/repositories/user-repository", () => ({
  userRepository: {
    getUserById: mocks.getUserById,
    updateLastRoom: mocks.updateLastRoom,
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

import { joinRoomByCode } from "@/server/services/membership-service";

describe("joinRoomByCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getUserById.mockResolvedValue({
      id: "user_1",
      email: "friend@example.com",
      name: "Friend",
    });
    mocks.getRoomByCode.mockResolvedValue({
      id: "room_1",
      slug: "friends-room",
      code: "MYIPL2026",
      name: "Friends Room",
      isActive: true,
      allowlistEnabled: false,
    });
    mocks.joinRoom.mockResolvedValue({
      id: "membership_1",
      roomId: "room_1",
      userId: "user_1",
      room: { id: "room_1", slug: "friends-room" },
      user: { id: "user_1" },
    });
  });

  it("joins successfully when the code matches and room allowlist is off", async () => {
    await joinRoomByCode("user_1", "MYIPL2026");

    expect(mocks.joinRoom).toHaveBeenCalledWith("room_1", "user_1");
    expect(mocks.updateLastRoom).toHaveBeenCalledWith("user_1", "room_1");
    expect(mocks.createAudit).toHaveBeenCalledTimes(1);
  });

  it("blocks join when the room allowlist is enabled and the email is not invited", async () => {
    mocks.getRoomByCode.mockResolvedValue({
      id: "room_1",
      slug: "friends-room",
      code: "MYIPL2026",
      name: "Friends Room",
      isActive: true,
      allowlistEnabled: true,
    });
    mocks.findAllowedEmail.mockResolvedValue(null);

    await expect(joinRoomByCode("user_1", "MYIPL2026")).rejects.toThrow(
      "not on the invite list",
    );
  });

  it("allows join when the email is invited for that specific room", async () => {
    mocks.getRoomByCode.mockResolvedValue({
      id: "room_2",
      slug: "office-room",
      code: "OFFICE2026",
      name: "Office Room",
      isActive: true,
      allowlistEnabled: true,
    });
    mocks.findAllowedEmail.mockResolvedValue({
      id: "allow_1",
      roomId: "room_2",
      email: "friend@example.com",
      isActive: true,
    });

    await joinRoomByCode("user_1", "OFFICE2026");

    expect(mocks.findAllowedEmail).toHaveBeenCalledWith(
      "room_2",
      "friend@example.com",
    );
    expect(mocks.joinRoom).toHaveBeenCalledWith("room_2", "user_1");
    expect(mocks.updateLastRoom).toHaveBeenCalledWith("user_1", "room_2");
  });
});

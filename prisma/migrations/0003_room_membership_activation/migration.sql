ALTER TABLE "RoomMembership" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "RoomMembership" ADD COLUMN "removedAt" TIMESTAMP(3);

CREATE INDEX "RoomMembership_roomId_isActive_idx" ON "RoomMembership"("roomId", "isActive");

ALTER TABLE "Room" ADD COLUMN "slug" TEXT;
ALTER TABLE "Room" ADD COLUMN "allowlistEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "lastRoomId" TEXT;
ALTER TABLE "AllowedEmail" ADD COLUMN "roomId" TEXT;

WITH ranked_rooms AS (
  SELECT
    id,
    COALESCE(
      NULLIF(
        TRIM(BOTH '-' FROM regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')),
        ''
      ),
      'room'
    ) AS base_slug,
    row_number() OVER (ORDER BY "createdAt" ASC, id ASC) AS position
  FROM "Room"
)
UPDATE "Room" AS room
SET "slug" = CASE
  WHEN ranked_rooms.position = 1 THEN ranked_rooms.base_slug
  ELSE ranked_rooms.base_slug || '-' || ranked_rooms.position::text
END
FROM ranked_rooms
WHERE ranked_rooms.id = room.id;

ALTER TABLE "Room" ALTER COLUMN "slug" SET NOT NULL;

WITH default_room AS (
  SELECT id
  FROM "Room"
  ORDER BY "createdAt" ASC, id ASC
  LIMIT 1
),
config AS (
  SELECT "allowlistEnabled"
  FROM "AppConfig"
  WHERE id = 'singleton'
)
UPDATE "Room" AS room
SET "allowlistEnabled" = config."allowlistEnabled"
FROM default_room, config
WHERE room.id = default_room.id;

WITH default_room AS (
  SELECT id
  FROM "Room"
  ORDER BY "createdAt" ASC, id ASC
  LIMIT 1
)
UPDATE "AllowedEmail" AS allowed_email
SET "roomId" = default_room.id
FROM default_room
WHERE allowed_email."roomId" IS NULL;

ALTER TABLE "AllowedEmail" ALTER COLUMN "roomId" SET NOT NULL;

WITH latest_memberships AS (
  SELECT DISTINCT ON ("userId")
    "userId",
    "roomId"
  FROM "RoomMembership"
  ORDER BY "userId", "joinedAt" DESC, id DESC
)
UPDATE "User" AS app_user
SET "lastRoomId" = latest_memberships."roomId"
FROM latest_memberships
WHERE latest_memberships."userId" = app_user.id
  AND app_user."lastRoomId" IS NULL;

DROP INDEX "AllowedEmail_email_key";

CREATE INDEX "User_lastRoomId_idx" ON "User"("lastRoomId");
CREATE UNIQUE INDEX "Room_slug_key" ON "Room"("slug");
CREATE INDEX "AllowedEmail_roomId_idx" ON "AllowedEmail"("roomId");
CREATE UNIQUE INDEX "AllowedEmail_roomId_email_key" ON "AllowedEmail"("roomId", "email");

ALTER TABLE "User"
ADD CONSTRAINT "User_lastRoomId_fkey"
FOREIGN KEY ("lastRoomId") REFERENCES "Room"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "AllowedEmail"
ADD CONSTRAINT "AllowedEmail_roomId_fkey"
FOREIGN KEY ("roomId") REFERENCES "Room"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

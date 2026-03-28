import { z } from "zod";

const positiveIntString = z
  .string()
  .trim()
  .regex(/^\d+$/)
  .transform((value) => Number(value));

const emailSchema = z.email().transform((value) => value.toLowerCase().trim());

function getOptional(name: string) {
  return process.env[name]?.trim();
}

export function getRequiredEnv(name: string) {
  const value = getOptional(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getPrivateRoomCode() {
  return (
    z.string().min(4).max(64).parse(getOptional("PRIVATE_ROOM_CODE") ?? "MYIPL2026")
  );
}

export function getAdminEmails() {
  const raw = getOptional("ADMIN_EMAILS");

  if (!raw) {
    return new Set<string>();
  }

  const parsed = raw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)
    .map((email) => emailSchema.parse(email));

  return new Set(parsed);
}

export function getDefaultCutoffMinutes() {
  const raw = getOptional("DEFAULT_CUTOFF_MINUTES") ?? "60";
  const parsed = positiveIntString.parse(raw);

  return Math.min(Math.max(parsed, 0), 24 * 60);
}

export function getAllowlistEnabledDefault() {
  return (getOptional("ALLOWLIST_ENABLED") ?? "false").toLowerCase() === "true";
}

export function getAppBaseUrl() {
  return getOptional("AUTH_URL") ?? getOptional("NEXTAUTH_URL") ?? "http://localhost:3000";
}

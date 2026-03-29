export function slugifyRoomName(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "room";
}

export function getRoomDashboardPath(roomSlug: string) {
  return `/rooms/${roomSlug}/dashboard`;
}

export function getRoomMatchesPath(roomSlug: string) {
  return `/rooms/${roomSlug}/matches`;
}

export function getRoomLeaderboardPath(roomSlug: string) {
  return `/rooms/${roomSlug}/leaderboard`;
}

export function getRoomPicksPath(roomSlug: string) {
  return `/rooms/${roomSlug}/picks`;
}

export function getRoomHistoryPath(roomSlug: string) {
  return `/rooms/${roomSlug}/history`;
}

export function getRoomAdminOverviewPath(roomSlug: string) {
  return `/admin/rooms/${roomSlug}`;
}

export function getRoomAdminMatchesPath(roomSlug: string) {
  return `/admin/rooms/${roomSlug}/matches`;
}

export function getRoomAdminResultsPath(roomSlug: string) {
  return `/admin/rooms/${roomSlug}/results`;
}

export function getRoomScopedPaths(roomSlug: string) {
  return [
    getRoomDashboardPath(roomSlug),
    getRoomLeaderboardPath(roomSlug),
    getRoomPicksPath(roomSlug),
    getRoomHistoryPath(roomSlug),
    getRoomMatchesPath(roomSlug),
    getRoomAdminOverviewPath(roomSlug),
    getRoomAdminMatchesPath(roomSlug),
    getRoomAdminResultsPath(roomSlug),
  ];
}

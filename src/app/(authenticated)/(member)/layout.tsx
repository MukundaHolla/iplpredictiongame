import { AppShell } from "@/components/layout/app-shell";
import { requireMemberUser } from "@/lib/access";
import { getLeaderboardPositionForUser } from "@/server/services/leaderboard-service";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, room } = await requireMemberUser();
  const rank = await getLeaderboardPositionForUser(user.id);

  return (
    <AppShell user={user} roomName={room.name} rank={rank}>
      {children}
    </AppShell>
  );
}

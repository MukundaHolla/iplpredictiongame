import { JoinRoomForm } from "@/components/forms/join-room-form";
import { BrandMark } from "@/components/brand-mark";
import { PageBackButton } from "@/components/navigation/page-back-button";
import { requireAuthenticatedUser } from "@/lib/access";
import { getRoomStateForUser } from "@/server/services/membership-service";
import { Button } from "@/components/ui/button";
import { LoadingLink } from "@/components/navigation/loading-link";
import { getRoomDashboardPath } from "@/lib/rooms";

export default async function JoinRoomPage() {
  const user = await requireAuthenticatedUser();
  const { memberships } = await getRoomStateForUser(user.id);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-12">
      <div className="hero-panel w-full space-y-8 p-8">
        <PageBackButton
          fallbackHref={memberships[0] ? getRoomDashboardPath(memberships[0].room.slug) : "/rooms"}
          className="rounded-full border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        />
        <BrandMark />
        <div className="space-y-3">
          <p className="font-heading text-sm uppercase tracking-[0.28em] text-blue-600">
            Private Room
          </p>
          <h1 className="font-heading text-4xl text-slate-900">Enter the room code</h1>
          <p className="text-base text-slate-600">
            Ask the room admin for the private room code. Once you join, that room gets its own leaderboard, picks, and invite list.
          </p>
        </div>
        {memberships.length > 0 ? (
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">Already joined</p>
            <div className="grid gap-2">
              {memberships.map((membership) => (
                <Button
                  key={membership.room.id}
                  asChild
                  variant="outline"
                  className="justify-between rounded-xl border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <LoadingLink
                    href={getRoomDashboardPath(membership.room.slug)}
                    message="Opening your room"
                  >
                    {membership.room.name}
                  </LoadingLink>
                </Button>
              ))}
            </div>
          </div>
        ) : null}
        <JoinRoomForm />
      </div>
    </div>
  );
}

import { ArrowRight, CheckCircle2, PlusCircle, ShieldCheck, Users } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { LoadingLink } from "@/components/navigation/loading-link";
import { Button } from "@/components/ui/button";
import { requireAuthenticatedUser } from "@/lib/access";
import { getRoomDashboardPath } from "@/lib/rooms";
import { getRoomsHomeView } from "@/server/services/query-service";

export default async function RoomsPage() {
  const user = await requireAuthenticatedUser();
  const roomsHome = await getRoomsHomeView(user.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24 lg:pb-8">
      <section className="surface-card overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="font-heading text-xs uppercase tracking-[0.28em] text-blue-600">
              Rooms
            </p>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl text-slate-900 sm:text-4xl">
                Choose your room
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Switch between private groups, keep separate leaderboards, and join another room
                any time with a code from that room&apos;s admin.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[22rem]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Joined rooms</p>
              <p className="mt-2 font-heading text-3xl text-slate-900">{roomsHome.rooms.length}</p>
            </div>
            <Button
              asChild
              className="h-auto rounded-2xl bg-blue-600 px-4 py-4 text-white hover:bg-blue-700"
            >
              <LoadingLink href="/join-room" message="Opening join room">
                <PlusCircle className="size-4" />
                Join another room
              </LoadingLink>
            </Button>
          </div>
        </div>
      </section>

      {roomsHome.rooms.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
          <div className="grid gap-4">
            {roomsHome.rooms.map((room) => (
              <div
                key={room.id}
                className="surface-card interactive-surface overflow-hidden p-5 sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-4">
                    <div className="space-y-2">
                      <p className="truncate font-heading text-2xl text-slate-900 sm:text-3xl">
                        {room.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs uppercase tracking-[0.18em] text-slate-600">
                          /{room.slug}
                        </span>
                        {roomsHome.currentRoomSlug === room.slug ? (
                          <span className="glass-chip bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="size-4" />
                            Current room
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="glass-chip">
                        <Users className="size-4" />
                        {room.memberCount} member{room.memberCount === 1 ? "" : "s"}
                      </span>
                      <span className="glass-chip">
                        <ShieldCheck className="size-4" />
                        {room.allowlistEnabled ? "Invite list enabled" : "Code-only access"}
                      </span>
                    </div>

                    <p className="max-w-2xl text-sm leading-6 text-slate-600">
                      Picks, leaderboard standings, and reveal state stay separate inside this
                      room.
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:w-44 lg:grid-cols-1">
                    <Button
                      asChild
                      className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <LoadingLink
                        href={getRoomDashboardPath(room.slug)}
                        message="Opening your room"
                      >
                        Open room
                        <ArrowRight className="size-4" />
                      </LoadingLink>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full rounded-xl border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <LoadingLink href="/join-room" message="Opening join room">
                        Add another
                      </LoadingLink>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="surface-card h-fit space-y-5 p-6">
            <div className="space-y-2">
              <p className="font-heading text-2xl text-slate-900">How rooms work</p>
              <p className="text-sm leading-6 text-slate-600">
                Each room stays separate, so your picks and leaderboard position only affect the
                people in that group.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                "Every room has its own room code and invite list.",
                "Use the room switcher in the top bar to jump between rooms quickly.",
                "Ask the room admin for the latest room code before you join.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No rooms yet"
          description="Ask a room admin for a room code, then join your first room to start making picks."
          action={
            <Button asChild className="rounded-xl bg-blue-600 text-white hover:bg-blue-700">
              <LoadingLink href="/join-room" message="Opening join room">
                Join a room
              </LoadingLink>
            </Button>
          }
        />
      )}
    </div>
  );
}

import { Activity, ArrowRight, CalendarClock, Home, Layers3, ShieldCheck, Trophy } from "lucide-react";

import { AdminConfigPanel } from "@/components/admin/admin-config-panel";
import { RoomManagementPanel } from "@/components/admin/room-management-panel";
import { LoadingLink } from "@/components/navigation/loading-link";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { requireGlobalAdminUser } from "@/lib/access";
import {
  getRoomAdminMatchesPath,
  getRoomAdminOverviewPath,
  getRoomAdminResultsPath,
  getRoomDashboardPath,
} from "@/lib/rooms";
import { getAdminOverviewData } from "@/server/services/admin-service";
import { getRoomStateForUser } from "@/server/services/membership-service";

export default async function AdminOverviewPage() {
  const user = await requireGlobalAdminUser();
  const data = await getAdminOverviewData();
  const roomState = await getRoomStateForUser(user.id);
  const currentRoom = roomState.room;
  const dashboardHref = currentRoom ? getRoomDashboardPath(currentRoom.slug) : "/rooms";

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24 lg:pb-8">
      <section className="surface-card overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <p className="font-heading text-xs uppercase tracking-[0.3em] text-blue-600">
              Admin
            </p>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl text-slate-900 sm:text-4xl">
                Admin dashboard
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                Create rooms, manage room-level access, update season rules, and settle matches
                without leaving the app.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[24rem]">
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-2xl border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:col-span-2"
            >
              <LoadingLink href={dashboardHref} message="Going back to the dashboard">
                <Home className="size-4" />
                Back to dashboard
              </LoadingLink>
            </Button>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Rooms</p>
              <p className="mt-2 font-heading text-3xl text-slate-900">{data.rooms.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Reveal mode</p>
              <p className="mt-2 font-heading text-lg text-slate-900">
                {data.config.predictionsRevealMode.replaceAll("_", " ")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          {
            icon: Layers3,
            label: "Rooms",
            value: String(data.rooms.length),
            copy: "Private groups currently available in the app.",
          },
          {
            icon: ShieldCheck,
            label: "Invite Mode",
            value: "Per Room",
            copy: "Each room now controls its own allowlist and room code.",
          },
          {
            icon: Activity,
            label: "Reveal Mode",
            value: data.config.predictionsRevealMode.replaceAll("_", " "),
            copy: "How aggregate room picks become visible.",
          },
        ].map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className="surface-card p-5">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50">
                <Icon className="size-5 text-blue-600" />
              </div>
              <p className="mt-4 font-heading text-sm uppercase tracking-[0.24em] text-blue-600">
                {card.label}
              </p>
              <p className="mt-2 font-heading text-3xl text-slate-900">{card.value}</p>
              <p className="mt-2 text-sm text-slate-500">{card.copy}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <AdminConfigPanel config={data.config} />

        {currentRoom ? (
          <section className="surface-card space-y-5 p-6">
            <div className="space-y-2">
              <p className="font-heading text-2xl text-slate-900">Current room shortcuts</p>
              <p className="text-sm leading-6 text-slate-600">
                The old fixture edit and result settlement tools now live inside each room admin
                area.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                {
                  title: "Room controls",
                copy: "Settings, room code, allowlist, and audit activity.",
                href: getRoomAdminOverviewPath(currentRoom.slug),
                icon: ShieldCheck,
              },
              {
                title: "Fixtures",
                copy: "Edit match start times, venues, stages, and cutoffs.",
                href: getRoomAdminMatchesPath(currentRoom.slug),
                icon: CalendarClock,
              },
              {
                title: "Results",
                copy: "Settle winners, no result, abandoned, or unsettle a match.",
                href: getRoomAdminResultsPath(currentRoom.slug),
                icon: Trophy,
                },
              ].map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.title}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                        <Icon className="size-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <h3 className="font-heading text-xl text-slate-900">{card.title}</h3>
                        <p className="text-sm leading-6 text-slate-500">{card.copy}</p>
                      </div>
                    </div>
                    <Button
                      asChild
                      className="mt-4 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <LoadingLink href={card.href} message={`Opening ${card.title.toLowerCase()}`}>
                        Open
                        <ArrowRight className="size-4" />
                      </LoadingLink>
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="surface-card flex items-center justify-center p-6 text-sm text-slate-500">
            Join a room to unlock room-specific admin shortcuts here.
          </div>
        )}
      </div>

      <RoomManagementPanel rooms={data.rooms} />

      <section className="surface-card space-y-5 p-6">
        <SectionHeader
          title="Recent audit activity"
          description="Every admin mutation leaves a simple trail so the room stays understandable."
        />
        <div className="grid gap-3">
          {data.audits.map((audit) => (
            <div
              key={audit.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">{audit.action.replaceAll("_", " ")}</p>
                  <p className="text-sm text-slate-500">
                    {audit.actorUser?.name ?? audit.actorUser?.email ?? "System"} ·{" "}
                    {audit.entityType} · {audit.entityId}
                  </p>
                </div>
                <p className="text-sm text-slate-500">
                  {new Date(audit.createdAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Kolkata",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

import { Activity, ArrowRight, CalendarClock, ShieldCheck, Trophy, Users } from "lucide-react";

import { AllowlistPanel } from "@/components/admin/allowlist-panel";
import { RoomPlayersPanel } from "@/components/admin/room-players-panel";
import { LoadingLink } from "@/components/navigation/loading-link";
import { PageBackButton } from "@/components/navigation/page-back-button";
import { RoomSettingsPanel } from "@/components/admin/room-settings-panel";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { requireRoomAdminUser } from "@/lib/access";
import { getRoomAdminMatchesPath, getRoomAdminResultsPath } from "@/lib/rooms";
import { getAdminRoomOverviewData } from "@/server/services/admin-service";

export default async function RoomAdminOverviewPage({
  params,
}: {
  params: Promise<{ roomSlug: string }>;
}) {
  const { roomSlug } = await params;
  await requireRoomAdminUser(roomSlug);
  const data = await getAdminRoomOverviewData(roomSlug);

  return (
    <div className="space-y-8">
      <PageBackButton
        fallbackHref="/admin"
        className="rounded-full border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      />

      <SectionHeader
        eyebrow="Overview"
        title="Room controls"
        description="This room keeps its own code, invite list, and leaderboard while sharing the same IPL fixture set."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        {[
          {
            icon: Users,
            label: "Members",
            value: String(data.membershipCount),
            copy: "Players currently joined to this room.",
          },
          {
            icon: Users,
            label: "Removed",
            value: String(data.removedMemberCount),
            copy: "Players who can be added back in their original room order.",
          },
          {
            icon: ShieldCheck,
            label: "Allowlist",
            value: data.room.allowlistEnabled ? "Enabled" : "Disabled",
            copy: "Room-code plus room-specific email invite protection.",
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

      <section className="grid gap-4 md:grid-cols-2">
        <div className="surface-card p-5">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50">
            <CalendarClock className="size-5 text-blue-600" />
          </div>
          <h3 className="mt-4 font-heading text-2xl text-slate-900">Fixture tools</h3>
          <p className="mt-2 text-sm text-slate-500">
            Update fixture timings, venues, stages, and room-facing cutoffs.
          </p>
          <Button asChild className="mt-4 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
            <LoadingLink href={getRoomAdminMatchesPath(roomSlug)} message="Opening fixtures">
              Open Fixtures
              <ArrowRight className="size-4" />
            </LoadingLink>
          </Button>
        </div>
        <div className="surface-card p-5">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50">
            <Trophy className="size-5 text-blue-600" />
          </div>
          <h3 className="mt-4 font-heading text-2xl text-slate-900">Result settlement</h3>
          <p className="mt-2 text-sm text-slate-500">
            Set winners, no result, abandoned, or unsettle a match when needed.
          </p>
          <Button asChild className="mt-4 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
            <LoadingLink href={getRoomAdminResultsPath(roomSlug)} message="Opening results">
              Open Results
              <ArrowRight className="size-4" />
            </LoadingLink>
          </Button>
        </div>
      </section>

      <RoomSettingsPanel
        room={{
          id: data.room.id,
          slug: data.room.slug,
          name: data.room.name,
          code: data.room.code,
          isActive: data.room.isActive,
          allowlistEnabled: data.room.allowlistEnabled,
        }}
      />
      <RoomPlayersPanel
        roomSlug={roomSlug}
        activeMembers={data.activeMembers}
        removedMembers={data.removedMembers}
      />
      <AllowlistPanel roomSlug={roomSlug} entries={data.allowlist} />

      <section className="space-y-4">
        <SectionHeader
          title="Recent audit activity"
          description="Recent admin actions across the app. Room-specific changes still appear here with room identifiers."
        />
        <div className="grid gap-3">
          {data.audits.map((audit) => (
            <div
              key={audit.id}
              className="surface-card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
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
          ))}
        </div>
      </section>
    </div>
  );
}

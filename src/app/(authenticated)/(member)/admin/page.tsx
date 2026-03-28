import { Activity, ShieldCheck, Users } from "lucide-react";

import { AllowlistPanel } from "@/components/admin/allowlist-panel";
import { AdminConfigPanel } from "@/components/admin/admin-config-panel";
import { SectionHeader } from "@/components/section-header";
import { requireAdminUser } from "@/lib/access";
import { getAdminOverviewData } from "@/server/services/admin-service";

export default async function AdminOverviewPage() {
  await requireAdminUser();
  const data = await getAdminOverviewData();

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Overview"
        title="Admin dashboard"
        description="Keep the season in sync, control private access, and audit every important change."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          {
            icon: Users,
            label: "Members",
            value: String(data.membershipCount),
            copy: "Players currently joined to the room.",
          },
          {
            icon: ShieldCheck,
            label: "Allowlist",
            value: data.config.allowlistEnabled ? "Enabled" : "Disabled",
            copy: "Room-code plus email invite protection.",
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

      <AdminConfigPanel config={data.config} />
      <AllowlistPanel entries={data.allowlist} />

      <section className="space-y-4">
        <SectionHeader
          title="Recent audit activity"
          description="Every admin mutation leaves a simple trail so the room stays understandable."
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

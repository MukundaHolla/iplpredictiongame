"use client";

import { usePathname } from "next/navigation";

import { LoadingLink } from "@/components/navigation/loading-link";
import {
  getRoomAdminMatchesPath,
  getRoomAdminOverviewPath,
  getRoomAdminResultsPath,
} from "@/lib/rooms";
import { cn } from "@/lib/utils";

type AdminTabsProps = {
  roomSlug: string;
};

export function AdminTabs({ roomSlug }: AdminTabsProps) {
  const pathname = usePathname();
  const tabs = [
    { href: getRoomAdminOverviewPath(roomSlug), label: "Overview" },
    { href: getRoomAdminMatchesPath(roomSlug), label: "Fixtures" },
    { href: getRoomAdminResultsPath(roomSlug), label: "Results" },
  ] as const;

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active =
          tab.href === getRoomAdminOverviewPath(roomSlug)
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

        return (
          <LoadingLink
            key={tab.href}
            href={tab.href}
            message={`Opening ${tab.label.toLowerCase()}`}
            className={cn(
              "glass-chip rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700",
            )}
          >
            {tab.label}
          </LoadingLink>
        );
      })}
    </div>
  );
}

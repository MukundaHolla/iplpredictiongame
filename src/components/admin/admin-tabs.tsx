"use client";

import { usePathname } from "next/navigation";

import { LoadingLink } from "@/components/navigation/loading-link";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/matches", label: "Fixtures" },
  { href: "/admin/results", label: "Results" },
] as const;

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active =
          tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);

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

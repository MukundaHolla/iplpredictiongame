import Image from "next/image";

import { cn } from "@/lib/utils";

type TeamBadgeProps = {
  shortCode: string;
  name: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  active?: boolean;
  compact?: boolean;
};

export function TeamBadge({
  shortCode,
  name,
  logoUrl,
  primaryColor,
  secondaryColor,
  active = false,
  compact = false,
}: TeamBadgeProps) {
  const accent = primaryColor ?? "#2563eb";
  const borderAccent = secondaryColor ?? "#bfdbfe";

  return (
    <div
      className={cn(
        "interactive-surface rounded-[1.75rem] border bg-white transition-all duration-200",
        compact ? "p-3" : "p-5",
        active
          ? "border-blue-400 shadow-md shadow-blue-100"
          : "border-slate-200",
      )}
      style={{
        boxShadow: active ? `0 14px 34px -24px ${accent}` : undefined,
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "overflow-hidden rounded-2xl border bg-slate-50",
            compact ? "size-11" : "size-14",
          )}
          style={{ borderColor: borderAccent }}
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${name} logo`}
              width={compact ? 44 : 56}
              height={compact ? 44 : 56}
              className="size-full object-contain p-1.5"
            />
          ) : (
            <div className="flex size-full items-center justify-center font-heading text-slate-900">
              {shortCode}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-heading text-xl text-slate-900">{shortCode}</p>
          <p className="truncate text-sm text-slate-500">{name}</p>
        </div>
      </div>
    </div>
  );
}

import Image from "next/image";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type TeamBadgeProps = {
  id?: string;
  shortCode: string;
  name: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  active?: boolean;
  compact?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function TeamBadge({
  id,
  shortCode,
  name,
  logoUrl,
  primaryColor,
  secondaryColor,
  active = false,
  compact = false,
  onClick,
  disabled = false,
  loading = false,
}: TeamBadgeProps) {
  const accent = primaryColor ?? "#2563eb";
  const borderAccent = secondaryColor ?? "#bfdbfe";
  const isInteractive = Boolean(onClick);

  const renderIndicator = () => {
    if (loading) {
      return (
        <span className="rounded-full border border-blue-200 bg-white p-2 text-blue-600">
          <LoaderCircle className="size-4 animate-spin" />
        </span>
      );
    }

    if (active) {
      return (
        <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Selected
        </span>
      );
    }

    return null;
  };

  const content = (
    <div className="flex min-h-[132px] min-w-0 flex-col justify-center gap-3 sm:min-h-[148px]">
      <div className="flex min-w-0 items-center gap-4 pr-0 md:pr-28">
        <div
          className={cn(
            "shrink-0 overflow-hidden rounded-full border-2 bg-white shadow-sm shadow-slate-200/80",
            compact ? "size-11" : "size-16 sm:size-20",
          )}
          style={{ borderColor: borderAccent }}
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${name} logo`}
              width={compact ? 44 : 80}
              height={compact ? 44 : 80}
              className="size-full object-contain p-1.5 sm:p-2"
            />
          ) : (
            <div className="flex size-full items-center justify-center font-heading text-slate-900">
              {shortCode}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-2xl leading-none text-slate-900 sm:text-[2rem]">
            {shortCode}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500 sm:text-base">{name}</p>
        </div>
      </div>

      <div className="sm:hidden">{renderIndicator()}</div>
    </div>
  );

  if (isInteractive) {
    return (
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-pressed={active}
        onClick={onClick}
        className={cn(
          "interactive-surface relative min-w-0 w-full rounded-[1.75rem] border bg-white text-left transition-all duration-200",
          compact ? "p-3" : "p-5 sm:p-6",
          active
            ? "border-emerald-300 bg-emerald-50 shadow-md shadow-emerald-100"
            : "border-slate-200",
          disabled && "cursor-not-allowed opacity-70",
          !disabled && "hover:border-blue-300 hover:bg-blue-50/50",
        )}
        style={{
          boxShadow: active ? `0 14px 34px -24px ${accent}` : undefined,
        }}
      >
        <div className="absolute right-5 top-5 hidden sm:block">{renderIndicator()}</div>
        {content}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "interactive-surface relative min-w-0 rounded-[1.75rem] border bg-white transition-all duration-200",
        compact ? "p-3" : "p-5 sm:p-6",
        active
          ? "border-emerald-300 bg-emerald-50 shadow-md shadow-emerald-100"
          : "border-slate-200",
      )}
      style={{
        boxShadow: active ? `0 14px 34px -24px ${accent}` : undefined,
      }}
    >
      <div className="absolute right-5 top-5 hidden sm:block">{renderIndicator()}</div>
      {content}
    </div>
  );
}

import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandMarkProps = {
  compact?: boolean;
  className?: string;
};

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", compact && "gap-2", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-slate-950/95 px-2 py-2 shadow-sm shadow-slate-200/70",
          compact ? "h-9 w-9 rounded-xl p-1" : "h-14 w-14",
        )}
      >
        <Image
          src="/ipl-logo.png"
          alt="IPL logo"
          width={64}
          height={64}
          className={cn("h-full w-full object-contain", compact ? "scale-110" : "")}
        />
      </div>
      <div className="min-w-0 space-y-0.5">
        <p
          className={cn(
            "truncate font-heading uppercase tracking-[0.28em] text-blue-600",
            compact ? "hidden text-[10px] sm:block sm:text-[10px]" : "text-sm",
          )}
        >
          IPL Prediction League
        </p>
        <h1
          className={cn(
            "truncate font-heading leading-none text-slate-900",
            compact ? "text-sm sm:text-base" : "text-2xl",
          )}
        >
          {compact ? "IPL Game 2026" : "IPL Prediction Game 2026"}
        </h1>
      </div>
    </div>
  );
}

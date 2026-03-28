import { Trophy } from "lucide-react";

import { cn } from "@/lib/utils";

type BrandMarkProps = {
  compact?: boolean;
  className?: string;
};

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600",
          compact ? "size-11" : "size-14",
        )}
      >
        <Trophy className={cn(compact ? "size-5" : "size-6")} />
      </div>
      <div className="space-y-0.5">
        <p className="font-heading text-sm uppercase tracking-[0.28em] text-blue-600">
          Private League
        </p>
        <h1
          className={cn(
            "font-heading leading-none text-slate-900",
            compact ? "text-lg" : "text-2xl",
          )}
        >
          IPL Prediction Game 2026
        </h1>
      </div>
    </div>
  );
}

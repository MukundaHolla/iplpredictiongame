"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

const defaultMessages = [
  "Getting things ready for you",
  "Warming up the game room",
  "Loading today's fixtures",
  "Refreshing the leaderboard",
];

type FullPageLoaderProps = {
  open?: boolean;
  title?: string;
  messages?: string[];
  className?: string;
};

export function FullPageLoader({
  open = true,
  title = "IPL Prediction Game 2026",
  messages = defaultMessages,
  className,
}: FullPageLoaderProps) {
  const safeMessages = useMemo(
    () => (messages.length > 0 ? messages : defaultMessages),
    [messages],
  );
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!open || safeMessages.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % safeMessages.length);
    }, 1800);

    return () => window.clearInterval(interval);
  }, [open, safeMessages]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-white/88 px-6 backdrop-blur-sm",
        className,
      )}
    >
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-blue-100/80">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <LoaderCircle className="size-6 animate-spin" />
        </div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.28em] text-blue-600">
          {title}
        </p>
        <p className="mt-3 text-2xl font-semibold text-slate-900">
          {safeMessages[messageIndex]}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          This should only take a moment.
        </p>
      </div>
    </div>
  );
}

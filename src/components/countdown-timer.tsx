"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type CountdownTimerProps = {
  targetIso: string;
  locked: boolean;
  className?: string;
};

function formatRemaining(targetIso: string, nowTimestamp = Date.now()) {
  const target = new Date(targetIso).getTime();
  const diff = target - nowTimestamp;

  if (diff <= 0) {
    return "Locked";
  }

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return parts.join(" ");
}

export function CountdownTimer({
  targetIso,
  locked,
  className,
}: CountdownTimerProps) {
  const [now, setNow] = useState(() => Date.now());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
      setNow(Date.now());
    });

    if (locked) {
      return () => window.cancelAnimationFrame(frame);
    }

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000 * 15);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(interval);
    };
  }, [locked, targetIso]);

  return (
    <span
      className={cn(
        "glass-chip font-medium",
        locked
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-blue-100 bg-blue-50 text-blue-700",
        className,
      )}
      suppressHydrationWarning
    >
      {locked ? "Locked" : mounted ? formatRemaining(targetIso, now) : "Calculating"}
    </span>
  );
}

"use client";

import { startTransition, useState } from "react";
import { usePathname } from "next/navigation";
import {
  CalendarRange,
  History,
  LayoutDashboard,
  LogOut,
  Settings2,
  Trophy,
} from "lucide-react";

import { signOutAction } from "@/actions/auth-actions";
import { BrandMark } from "@/components/brand-mark";
import { LoadingLink } from "@/components/navigation/loading-link";
import { useAppLoading } from "@/components/providers/app-loading-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: "USER" | "ADMIN";
  };
  roomName: string;
  rank: number | null;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/matches", label: "Matches", icon: CalendarRange },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/history", label: "History", icon: History },
] as const;

export function AppShell({ children, user, roomName, rank }: AppShellProps) {
  const pathname = usePathname();
  const { beginLoading, endLoading } = useAppLoading();
  const [isSigningOut, setIsSigningOut] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <BrandMark compact className="min-w-0" />
          <div className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);

              return (
                <LoadingLink
                  key={item.href}
                  href={item.href}
                  message={`Opening ${item.label.toLowerCase()}`}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </LoadingLink>
              );
            })}
            {user.role === "ADMIN" ? (
              <LoadingLink
                href="/admin"
                message="Opening admin dashboard"
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith("/admin")
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <Settings2 className="size-4" />
                Admin
              </LoadingLink>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{roomName}</p>
              <p className="text-xs text-slate-500">
                {rank ? `Current rank #${rank}` : "Rank will appear after results settle"}
              </p>
            </div>
            <Avatar className="size-11 border border-slate-200">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
              <AvatarFallback className="bg-blue-50 font-heading text-blue-700">
                {(user.name ?? user.email ?? "P").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="outline"
              disabled={isSigningOut}
              onClick={() => {
                setIsSigningOut(true);
                beginLoading("Signing you out");

                startTransition(async () => {
                  try {
                    await signOutAction();
                  } finally {
                    endLoading();
                    setIsSigningOut(false);
                  }
                });
              }}
              className="rounded-full border-slate-200 bg-white px-3 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>

      <nav className="fixed inset-x-4 bottom-4 z-40 rounded-3xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/80 lg:hidden">
        <div className="grid grid-cols-4 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);

            return (
              <LoadingLink
                key={item.href}
                href={item.href}
                message={`Opening ${item.label.toLowerCase()}`}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs transition-colors",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </LoadingLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

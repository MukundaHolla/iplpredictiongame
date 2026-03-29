"use client";

import { startTransition, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarRange,
  Check,
  ChevronDown,
  History,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings2,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { signOutAction } from "@/actions/auth-actions";
import { PageBackButton } from "@/components/navigation/page-back-button";
import { switchActiveRoomAction } from "@/actions/rooms";
import { BrandMark } from "@/components/brand-mark";
import { LoadingLink } from "@/components/navigation/loading-link";
import { useAppLoading } from "@/components/providers/app-loading-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getRoomDashboardPath,
  getRoomHistoryPath,
  getRoomLeaderboardPath,
  getRoomMatchesPath,
  getRoomPicksPath,
} from "@/lib/rooms";
import { isNextRedirectError } from "@/lib/is-next-redirect-error";
import type { RoomSummaryView } from "@/lib/types";
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
  currentRoom: RoomSummaryView;
  joinedRooms: RoomSummaryView[];
  rank: number | null;
};

export function AppShell({ children, user, currentRoom, joinedRooms, rank }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { beginLoading, endLoading } = useAppLoading();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSwitchingRoom, startSwitchRoomTransition] = useTransition();

  const navItems = [
    {
      href: getRoomDashboardPath(currentRoom.slug),
      label: "Dashboard",
      mobileLabel: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: getRoomLeaderboardPath(currentRoom.slug),
      label: "Leaderboard",
      mobileLabel: "Leaderboard",
      icon: Trophy,
    },
    {
      href: getRoomPicksPath(currentRoom.slug),
      label: "See what others picked",
      mobileLabel: "Room picks",
      icon: Users,
    },
    {
      href: getRoomHistoryPath(currentRoom.slug),
      label: "History",
      mobileLabel: "History",
      icon: History,
    },
    {
      href: getRoomMatchesPath(currentRoom.slug),
      label: "Matches",
      mobileLabel: "Matches",
      icon: CalendarRange,
    },
  ] as const;
  const dashboardHref = getRoomDashboardPath(currentRoom.slug);
  const shouldShowBackButton =
    pathname !== "/dashboard" && pathname !== dashboardHref;

  const switchRoom = (roomSlug: string) => {
    if (roomSlug === currentRoom.slug) {
      return;
    }

    beginLoading("Opening your room");

    startSwitchRoomTransition(async () => {
      const result = await switchActiveRoomAction({ roomSlug });

      if (!result.success || !result.data) {
        endLoading();
        toast.error(result.message);
        return;
      }

      router.push(result.data.redirectPath);
      router.refresh();
      endLoading();
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:flex-nowrap lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 lg:flex-none">
            <LoadingLink
              href={dashboardHref}
              message="Opening dashboard"
              suppressHydrationWarning
              className="shrink-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
            >
              <BrandMark compact className="max-w-[6.75rem] sm:max-w-[9rem] md:max-w-[10rem]" />
            </LoadingLink>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  suppressHydrationWarning
                  className="h-11 w-[7.5rem] shrink-0 justify-between rounded-full border-slate-200 bg-white px-3 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:w-[8.5rem] sm:px-4"
                >
                  <span suppressHydrationWarning className="truncate">
                    Your room
                  </span>
                  <ChevronDown className="size-4 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border-slate-200 bg-white p-2"
              >
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Current room
                  </p>
                  <p className="mt-2 break-words text-sm font-medium text-slate-900">
                    {currentRoom.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {currentRoom.memberCount} member{currentRoom.memberCount === 1 ? "" : "s"}
                  </p>
                </div>
                <DropdownMenuSeparator className="my-2 bg-slate-200" />
                <DropdownMenuLabel className="px-2 py-2 text-slate-500">
                  Switch rooms
                </DropdownMenuLabel>
                {joinedRooms.map((room) => (
                  <DropdownMenuItem
                    key={room.id}
                    onSelect={(event) => {
                      event.preventDefault();
                      switchRoom(room.slug);
                    }}
                    className={cn(
                      "rounded-xl px-3 py-3 text-slate-700 focus:bg-blue-50 focus:text-blue-700",
                      room.slug === currentRoom.slug && "bg-blue-50 text-blue-700",
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium leading-5 text-inherit">
                          {room.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {room.memberCount} member{room.memberCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      {room.slug === currentRoom.slug ? (
                        <Check className="size-4 shrink-0" />
                      ) : null}
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-slate-200" />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    beginLoading("Opening your rooms");
                    router.push("/rooms");
                  }}
                  className="rounded-xl px-3 py-3 text-slate-700 focus:bg-blue-50 focus:text-blue-700"
                >
                  <Settings2 className="size-4" />
                  Manage rooms
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    beginLoading("Opening join room");
                    router.push("/join-room");
                  }}
                  className="rounded-xl px-3 py-3 text-slate-700 focus:bg-blue-50 focus:text-blue-700"
                >
                  <Plus className="size-4" />
                  Join another room
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="order-3 hidden w-full items-center gap-2 lg:order-2 lg:flex lg:w-auto">
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

          <div className="order-2 flex items-center gap-2 sm:gap-3 lg:order-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium text-slate-900">
                {user.name ?? user.email ?? "Player"}
              </p>
              <p className="text-xs text-slate-500">
                {rank ? `Current rank #${rank}` : "Rank will appear after results settle"}
              </p>
            </div>
            {user.role === "ADMIN" ? (
              <Button
                asChild
                variant="outline"
                className="rounded-full border-slate-200 bg-white px-3 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:hidden"
              >
                <LoadingLink href="/admin" message="Opening admin dashboard">
                  <Settings2 className="size-4" />
                  <span className="hidden sm:inline">Admin</span>
                </LoadingLink>
              </Button>
            ) : null}
            <Avatar className="size-11 border border-slate-200">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
              <AvatarFallback className="bg-blue-50 font-heading text-blue-700">
                {(user.name ?? user.email ?? "P").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="outline"
              disabled={isSigningOut || isSwitchingRoom}
              onClick={() => {
                setIsSigningOut(true);
                beginLoading("Signing you out");

                startTransition(async () => {
                  let redirected = false;

                  try {
                    await signOutAction();
                  } catch (error) {
                    if (isNextRedirectError(error)) {
                      redirected = true;
                      return;
                    }

                    toast.error(
                      error instanceof Error ? error.message : "We couldn't sign you out.",
                    );
                  } finally {
                    if (!redirected) {
                      endLoading();
                    }
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

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {shouldShowBackButton ? (
          <div className="mb-5">
            <PageBackButton
              fallbackHref="/rooms"
              className="rounded-full border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            />
          </div>
        ) : null}
        {children}
      </main>

      <nav className="fixed inset-x-4 bottom-4 z-40 rounded-3xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/80 lg:hidden">
        <div className="grid grid-cols-5 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);

            return (
              <LoadingLink
                key={item.href}
                href={item.href}
                message={`Opening ${item.label.toLowerCase()}`}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] leading-tight transition-colors",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <Icon className="size-4" />
                <span className="text-center">{item.mobileLabel}</span>
              </LoadingLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

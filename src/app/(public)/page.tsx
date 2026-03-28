import { ArrowRight, CheckCircle2, ShieldCheck, Users } from "lucide-react";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { BrandMark } from "@/components/brand-mark";
import { LoadingLink } from "@/components/navigation/loading-link";
import { Button } from "@/components/ui/button";
import { getSessionUserOrNull } from "@/lib/access";
import { getPreferredRoomRedirectPath, getRoomStateForUser } from "@/server/services/membership-service";

export default async function LandingPage() {
  const sessionUser = await getSessionUserOrNull();
  const roomState = sessionUser?.id ? await getRoomStateForUser(sessionUser.id) : null;
  const preferredRoomPath =
    sessionUser?.id && roomState ? await getPreferredRoomRedirectPath(sessionUser.id) : "/join-room";

  return (
    <div className="mx-auto flex min-h-[100svh] max-w-5xl flex-col justify-center overflow-hidden px-4 py-4 sm:px-6 sm:py-8 lg:min-h-screen lg:py-10">
      <div className="hero-panel overflow-hidden px-5 py-6 sm:px-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.85fr)] lg:items-center">
          <div className="space-y-5 sm:space-y-6">
            <div className="sm:hidden">
              <BrandMark compact className="max-w-[11rem]" />
            </div>
            <div className="hidden sm:block">
              <BrandMark />
            </div>
            <div className="space-y-3 sm:space-y-4">
              <p className="glass-chip">Private rooms. Match-day picks. Clean leaderboards.</p>
              <h2 className="max-w-3xl font-heading text-3xl leading-tight text-slate-900 sm:text-5xl">
                A simple IPL prediction game for your private groups.
              </h2>
              <p className="max-w-2xl text-base text-slate-600 sm:text-lg">
                Sign in with Google, get the room code from your admin, and make one winner pick
                per match before the cutoff.
              </p>
            </div>
            <div className="max-w-sm">
              {sessionUser ? (
                <Button
                  asChild
                  className="h-12 w-full rounded-xl bg-blue-600 px-6 text-white hover:bg-blue-700"
                >
                  <LoadingLink
                    href={roomState?.membership ? preferredRoomPath : "/join-room"}
                    message="Getting things ready for you"
                  >
                    {roomState?.membership ? "Open My Room" : "Join Room"}
                    <ArrowRight className="size-4" />
                  </LoadingLink>
                </Button>
              ) : (
                <GoogleSignInButton fullWidth />
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 lg:hidden">
              {[
                { title: "Private", copy: "Friends only" },
                { title: "Fast", copy: "One pick only" },
                { title: "Fair", copy: "Official results" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center"
                >
                  <p className="font-heading text-sm text-slate-900">{item.title}</p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">{item.copy}</p>
                </div>
              ))}
            </div>
            <p className="text-xs leading-5 text-slate-500 sm:text-sm">
              Room code access comes from your room admin. Invite-only rooms may also require your
              Google email to be pre-approved.
            </p>
          </div>

          <div className="hidden lg:block surface-card p-6">
            <p className="font-heading text-2xl text-slate-900">Why it works</p>
            <div className="mt-5 grid gap-3">
              {[
                {
                  icon: Users,
                  title: "Room based",
                  copy: "Each group keeps its own room code, invite list, and leaderboard.",
                },
                {
                  icon: CheckCircle2,
                  title: "Simple picks",
                  copy: "One winner pick per match, editable only until the cutoff.",
                },
                {
                  icon: ShieldCheck,
                  title: "Reliable results",
                  copy: "Match results are updated in-app so the leaderboard stays clean and dependable.",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-50">
                        <Icon className="size-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{item.title}</p>
                        <p className="text-sm text-slate-500">{item.copy}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

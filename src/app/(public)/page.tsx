import { ArrowRight } from "lucide-react";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { BrandMark } from "@/components/brand-mark";
import { EmptyState } from "@/components/empty-state";
import { LoadingLink } from "@/components/navigation/loading-link";
import { Button } from "@/components/ui/button";
import { getSessionUserOrNull } from "@/lib/access";
import { getRoomStateForUser } from "@/server/services/membership-service";

export default async function LandingPage() {
  const sessionUser = await getSessionUserOrNull();
  const roomState = sessionUser?.id ? await getRoomStateForUser(sessionUser.id) : null;

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-10 sm:px-6">
      <div className="hero-panel px-6 py-8 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-6">
            <BrandMark />
            <div className="space-y-4">
              <p className="glass-chip">
                Private room. One pick per match. Simple leaderboard.
              </p>
              <h2 className="max-w-3xl font-heading text-4xl leading-tight text-slate-900 sm:text-5xl">
                Make your IPL 2026 picks with your friends, one match at a time.
              </h2>
              <p className="max-w-2xl text-lg text-slate-600">
                Sign in with Google, get the room code from the admin, and submit your
                prediction on the day of each match before the cutoff.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {sessionUser ? (
                <Button
                  asChild
                  className="h-12 rounded-xl bg-blue-600 px-6 text-white hover:bg-blue-700"
                >
                  <LoadingLink
                    href={roomState?.membership ? "/dashboard" : "/join-room"}
                    message="Getting things ready for you"
                  >
                    {roomState?.membership ? "Open Dashboard" : "Join Private Room"}
                    <ArrowRight className="size-4" />
                  </LoadingLink>
                </Button>
              ) : (
                <GoogleSignInButton />
              )}
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-xl border-slate-200 bg-white px-6 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <LoadingLink href="/leaderboard" message="Opening leaderboard">
                  See Leaderboard
                </LoadingLink>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <EmptyState
          title="Built for one private group"
          description="Only invited friends join the room, make picks on match day, and follow the same leaderboard all season."
        />
      </div>
    </div>
  );
}

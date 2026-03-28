import { redirect } from "next/navigation";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { BrandMark } from "@/components/brand-mark";
import { getSessionUserOrNull } from "@/lib/access";
import { getRoomStateForUser } from "@/server/services/membership-service";

export default async function LoginPage() {
  const sessionUser = await getSessionUserOrNull();

  if (sessionUser?.id) {
    const roomState = await getRoomStateForUser(sessionUser.id);
    redirect(roomState.membership ? "/dashboard" : "/join-room");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4 py-12">
      <div className="hero-panel w-full space-y-8 p-8">
        <BrandMark />
        <div className="space-y-3">
          <p className="font-heading text-sm uppercase tracking-[0.28em] text-blue-600">
            Sign In
          </p>
          <h1 className="font-heading text-4xl text-slate-900">
            Continue with your Google account
          </h1>
          <p className="text-base text-slate-600">
            Sign in first, then ask the admin for the room code to join the private
            league.
          </p>
        </div>
        <GoogleSignInButton fullWidth />
      </div>
    </div>
  );
}

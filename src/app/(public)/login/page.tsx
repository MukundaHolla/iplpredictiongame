import { redirect } from "next/navigation";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { BrandMark } from "@/components/brand-mark";
import { PageBackButton } from "@/components/navigation/page-back-button";
import { getSessionUserOrNull } from "@/lib/access";
import { getPreferredRoomRedirectPath } from "@/server/services/membership-service";

export default async function LoginPage() {
  const sessionUser = await getSessionUserOrNull();

  if (sessionUser?.id) {
    redirect(await getPreferredRoomRedirectPath(sessionUser.id));
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4 py-12">
      <div className="hero-panel w-full space-y-8 p-8">
        <PageBackButton
          fallbackHref="/"
          className="rounded-full border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        />
        <BrandMark />
        <div className="space-y-3">
          <p className="font-heading text-sm uppercase tracking-[0.28em] text-blue-600">
            Sign In
          </p>
          <h1 className="font-heading text-4xl text-slate-900">
            Continue with your Google account
          </h1>
          <p className="text-base text-slate-600">
            Sign in first, then choose one of your rooms or join a new room with a room code from the admin.
          </p>
        </div>
        <GoogleSignInButton fullWidth />
      </div>
    </div>
  );
}

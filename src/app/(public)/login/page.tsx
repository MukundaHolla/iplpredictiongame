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
    <div className="mx-auto flex min-h-[100svh] max-w-xl items-center justify-center overflow-hidden px-4 py-4 sm:px-6 sm:py-12">
      <div className="hero-panel w-full space-y-5 p-5 sm:space-y-8 sm:p-8">
        <PageBackButton
          fallbackHref="/"
          className="h-9 w-fit rounded-full border-slate-200 bg-white px-3 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        />
        <div className="sm:hidden">
          <BrandMark compact className="max-w-[11rem]" />
        </div>
        <div className="hidden sm:block">
          <BrandMark />
        </div>
        <div className="space-y-2 sm:space-y-3">
          <p className="font-heading text-sm uppercase tracking-[0.28em] text-blue-600">
            Sign In
          </p>
          <h1 className="font-heading text-3xl text-slate-900 sm:text-4xl">
            Continue with your Google account
          </h1>
          <p className="text-sm leading-6 text-slate-600 sm:text-base">
            <span className="sm:hidden">
              Sign in with Google, then join your room with the code from the admin.
            </span>
            <span className="hidden sm:inline">
              Sign in first, then choose one of your rooms or join a new room with a room code
              from the admin.
            </span>
          </p>
        </div>
        <GoogleSignInButton fullWidth />
      </div>
    </div>
  );
}

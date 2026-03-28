"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { signOutAction } from "@/actions/auth-actions";
import { joinRoomAction } from "@/actions/join-room";
import { useAppLoading } from "@/components/providers/app-loading-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isNextRedirectError } from "@/lib/is-next-redirect-error";

type JoinRoomFormProps = {
  helperText?: string;
  submitLabel?: string;
};

export function JoinRoomForm({
  helperText,
  submitLabel = "Join Room",
}: JoinRoomFormProps) {
  const router = useRouter();
  const { beginLoading, endLoading } = useAppLoading();
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSigningOut, startSignOutTransition] = useTransition();

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        beginLoading("Warming up the game room");

        startTransition(async () => {
          const result = await joinRoomAction({ code });

          if (!result.success) {
            endLoading();
            toast.error(result.message);
            return;
          }

          toast.success(result.message ?? "Joined the room.");
          router.push(result.data?.redirectPath ?? "/rooms");
          router.refresh();
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="room-code" className="text-slate-700">
          Private room code
        </Label>
        <Input
          id="room-code"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="Get this from the admin"
          className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
        />
      </div>
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-600">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-blue-600" />
          <p>
            {helperText ??
              "Get the room code from the admin. Some rooms also require your Google email to be invited."}
          </p>
        </div>
      </div>
      <Button
        type="submit"
        disabled={isPending || isSigningOut || code.trim().length < 4}
        className="h-12 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700"
      >
        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : submitLabel}
      </Button>
      <div className="space-y-3">
        <p className="text-center text-sm text-slate-500">
          Signed in with a different Google account? Sign out and try again with the invited
          email.
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={isPending || isSigningOut}
          onClick={() => {
            beginLoading("Switching accounts");

            startSignOutTransition(async () => {
              let redirected = false;

              try {
                await signOutAction();
              } catch (error) {
                if (isNextRedirectError(error)) {
                  redirected = true;
                  return;
                }

                toast.error(error instanceof Error ? error.message : "We couldn't sign you out.");
              } finally {
                if (!redirected) {
                  endLoading();
                }
              }
            });
          }}
          className="h-12 w-full rounded-xl border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          {isSigningOut ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <>
              <LogOut className="size-4" />
              Sign Out
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

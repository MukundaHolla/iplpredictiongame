"use client";

import { useTransition } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { signInWithGoogle } from "@/actions/auth-actions";
import { useAppLoading } from "@/components/providers/app-loading-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GoogleSignInButtonProps = {
  className?: string;
  fullWidth?: boolean;
};

export function GoogleSignInButton({
  className,
  fullWidth = false,
}: GoogleSignInButtonProps) {
  const { beginLoading, endLoading } = useAppLoading();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={isPending}
      onClick={() => {
        beginLoading("Getting things ready for you");

        startTransition(async () => {
          try {
            await signInWithGoogle();
          } catch (error) {
            endLoading();
            toast.error(
              error instanceof Error ? error.message : "We couldn't start Google sign-in.",
            );
          }
        });
      }}
      className={cn(
        "h-12 rounded-xl bg-blue-600 px-6 text-white hover:bg-blue-700",
        fullWidth && "w-full",
        className,
      )}
    >
      {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      Continue with Google
      <ArrowRight className="size-4" />
    </Button>
  );
}

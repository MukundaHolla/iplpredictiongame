"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { useAppLoading } from "@/components/providers/app-loading-provider";
import { Button } from "@/components/ui/button";

type PageBackButtonProps = {
  fallbackHref?: string;
  label?: string;
  className?: string;
};

export function PageBackButton({
  fallbackHref = "/",
  label = "Back",
  className,
}: PageBackButtonProps) {
  const router = useRouter();
  const { beginLoading } = useAppLoading();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        beginLoading("Going back");

        if (window.history.length > 1) {
          router.back();
          return;
        }

        router.push(fallbackHref);
      }}
      className={className}
    >
      <ArrowLeft className="size-4" />
      {label}
    </Button>
  );
}

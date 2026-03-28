"use client";

import { AppLoadingProvider } from "@/components/providers/app-loading-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <TooltipProvider delayDuration={120}>
      <AppLoadingProvider>
        {children}
        <Toaster
          richColors
          position="top-center"
          toastOptions={{
            className:
              "border border-slate-200 bg-white text-slate-900 shadow-lg shadow-slate-200/80",
          }}
        />
      </AppLoadingProvider>
    </TooltipProvider>
  );
}

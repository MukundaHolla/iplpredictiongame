"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";

import { FullPageLoader } from "@/components/loading/full-page-loader";

type AppLoadingContextValue = {
  beginLoading: (message?: string) => void;
  endLoading: () => void;
};

const AppLoadingContext = createContext<AppLoadingContextValue | null>(null);

type AppLoadingProviderProps = {
  children: React.ReactNode;
};

export function AppLoadingProvider({ children }: AppLoadingProviderProps) {
  const pathname = usePathname();
  const [state, setState] = useState<{
    open: boolean;
    message?: string;
  }>({
    open: false,
  });

  const beginLoading = useCallback((message?: string) => {
    setState({
      open: true,
      message,
    });
  }, []);

  const endLoading = useCallback(() => {
    setState((current) => ({
      ...current,
      open: false,
    }));
  }, []);

  useEffect(() => {
    if (!state.open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      endLoading();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname, state.open, endLoading]);

  const value = useMemo(
    () => ({
      beginLoading,
      endLoading,
    }),
    [beginLoading, endLoading],
  );

  return (
    <AppLoadingContext.Provider value={value}>
      {children}
      <FullPageLoader
        open={state.open}
        messages={state.message ? [state.message] : undefined}
      />
    </AppLoadingContext.Provider>
  );
}

export function useAppLoading() {
  const context = useContext(AppLoadingContext);

  if (!context) {
    throw new Error("useAppLoading must be used within AppLoadingProvider.");
  }

  return context;
}

"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

import { useAppLoading } from "@/components/providers/app-loading-provider";

type LoadingLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
  children: ReactNode;
  className?: string;
  message?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function LoadingLink({
  children,
  className,
  message,
  onClick,
  ...props
}: LoadingLinkProps) {
  const { beginLoading } = useAppLoading();

  return (
    <Link
      {...props}
      className={className}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          beginLoading(message);
        }
      }}
    >
      {children}
    </Link>
  );
}

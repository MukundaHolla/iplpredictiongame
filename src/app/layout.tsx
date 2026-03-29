import type { Metadata } from "next";
import localFont from "next/font/local";

import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const bodyFont = localFont({
  variable: "--font-rajdhani",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/rajdhani-400.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/rajdhani-500.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/rajdhani-600.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/rajdhani-700.ttf",
      weight: "700",
      style: "normal",
    },
  ],
});

const headingFont = localFont({
  variable: "--font-oxanium",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/oxanium-400.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/oxanium-500.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/oxanium-600.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/oxanium-700.ttf",
      weight: "700",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  title: "IPL Prediction Game 2026",
  description:
    "A private IPL prediction game for friends with Google sign-in, match locks, admin settlement, and a live leaderboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${headingFont.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

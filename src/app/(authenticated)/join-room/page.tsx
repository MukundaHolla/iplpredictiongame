import { redirect } from "next/navigation";

import { JoinRoomForm } from "@/components/forms/join-room-form";
import { BrandMark } from "@/components/brand-mark";
import { requireAuthenticatedUser } from "@/lib/access";
import { getRoomStateForUser } from "@/server/services/membership-service";

export default async function JoinRoomPage() {
  const user = await requireAuthenticatedUser();
  const { membership, config } = await getRoomStateForUser(user.id);

  if (membership) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-12">
      <div className="hero-panel w-full space-y-8 p-8">
        <BrandMark />
        <div className="space-y-3">
          <p className="font-heading text-sm uppercase tracking-[0.28em] text-blue-600">
            Private Room
          </p>
          <h1 className="font-heading text-4xl text-slate-900">Enter the room code</h1>
          <p className="text-base text-slate-600">
            Ask the admin for the private room code. Once you join, you can start
            making predictions on each match day.
          </p>
        </div>
        <JoinRoomForm allowlistEnabled={config.allowlistEnabled} />
      </div>
    </div>
  );
}

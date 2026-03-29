"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, RotateCcw, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  adminRemoveRoomMemberAction,
  adminRestoreRoomMemberAction,
} from "@/actions/admin";
import { useAppLoading } from "@/components/providers/app-loading-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { AdminRoomMemberView } from "@/lib/types";

type RoomPlayersPanelProps = {
  roomSlug: string;
  activeMembers: AdminRoomMemberView[];
  removedMembers: AdminRoomMemberView[];
};

function formatMemberDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

export function RoomPlayersPanel({
  roomSlug,
  activeMembers,
  removedMembers,
}: RoomPlayersPanelProps) {
  const router = useRouter();
  const { beginLoading, endLoading } = useAppLoading();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = (
    key: string,
    loadingMessage: string,
    handler: () => Promise<{ success: boolean; message?: string }>,
  ) => {
    setPendingKey(key);
    beginLoading(loadingMessage);

    startTransition(async () => {
      const result = await handler();
      setPendingKey(null);

      if (!result.success) {
        endLoading();
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
      endLoading();
    });
  };

  return (
    <div className="surface-card space-y-6 p-6">
      <div className="space-y-1">
        <p className="font-heading text-xl text-slate-900">Room players</p>
        <p className="text-sm text-slate-500">
          Remove a player from this room without losing their original join spot. Restoring them
          later brings them back in the same room order and history.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium text-slate-900">Active players</p>
          <p className="text-sm text-slate-500">
            {activeMembers.length} player{activeMembers.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="grid gap-3">
          {activeMembers.map((member) => (
            <div
              key={member.userId}
              className="interactive-surface flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-11 border border-slate-200">
                  <AvatarImage src={member.image ?? undefined} alt={member.name} />
                  <AvatarFallback className="bg-blue-50 font-heading text-blue-700">
                    {member.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{member.name}</p>
                  <p className="truncate text-sm text-slate-500">
                    {member.email ?? "No email available"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Joined {formatMemberDate(member.joinedAt)}
                    {member.role === "ADMIN" ? " · Admin" : ""}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="destructive"
                onClick={() =>
                  runAction(`remove-${member.userId}`, "Updating room players", async () =>
                    adminRemoveRoomMemberAction({
                      roomSlug,
                      userId: member.userId,
                    }),
                  )
                }
                className="rounded-xl"
              >
                {isPending && pendingKey === `remove-${member.userId}` ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <UserMinus className="size-4" />
                )}
                Remove
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium text-slate-900">Removed players</p>
          <p className="text-sm text-slate-500">
            {removedMembers.length} player{removedMembers.length === 1 ? "" : "s"}
          </p>
        </div>

        {removedMembers.length > 0 ? (
          <div className="grid gap-3">
            {removedMembers.map((member) => (
              <div
                key={member.userId}
                className="interactive-surface flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-11 border border-slate-200">
                    <AvatarImage src={member.image ?? undefined} alt={member.name} />
                    <AvatarFallback className="bg-slate-100 font-heading text-slate-700">
                      {member.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{member.name}</p>
                    <p className="truncate text-sm text-slate-500">
                      {member.email ?? "No email available"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Joined {formatMemberDate(member.joinedAt)}
                      {member.removedAt ? ` · Removed ${formatMemberDate(member.removedAt)}` : ""}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    runAction(`restore-${member.userId}`, "Updating room players", async () =>
                      adminRestoreRoomMemberAction({
                        roomSlug,
                        userId: member.userId,
                      }),
                    )
                  }
                  className="rounded-xl border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  {isPending && pendingKey === `restore-${member.userId}` ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <RotateCcw className="size-4" />
                  )}
                  Add Back
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            No one has been removed from this room yet.
          </div>
        )}
      </section>
    </div>
  );
}

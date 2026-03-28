"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, RefreshCcw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { adminRecalculateAction, adminUpdateRoomAction } from "@/actions/admin";
import { useAppLoading } from "@/components/providers/app-loading-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type RoomSettingsPanelProps = {
  room: {
    id: string;
    slug: string;
    name: string;
    code: string;
    isActive: boolean;
    allowlistEnabled: boolean;
  };
};

export function RoomSettingsPanel({ room }: RoomSettingsPanelProps) {
  const router = useRouter();
  const { beginLoading, endLoading } = useAppLoading();
  const [name, setName] = useState(room.name);
  const [slug, setSlug] = useState(room.slug);
  const [code, setCode] = useState(room.code);
  const [isActive, setIsActive] = useState(room.isActive);
  const [allowlistEnabled, setAllowlistEnabled] = useState(room.allowlistEnabled);
  const [pendingAction, setPendingAction] = useState<"save" | "recalculate" | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = (action: "save" | "recalculate", handler: () => Promise<void>) => {
    setPendingAction(action);
    beginLoading(action === "save" ? "Saving room settings" : "Refreshing leaderboard");

    startTransition(async () => {
      await handler();
      setPendingAction(null);
      endLoading();
    });
  };

  return (
    <div className="surface-card space-y-6 p-6">
      <div className="space-y-1">
        <p className="font-heading text-xl text-slate-900">Room settings</p>
        <p className="text-sm text-slate-500">
          Update this room&apos;s identity, join code, active state, and invite rules.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label className="text-slate-700">Room name</Label>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11 rounded-xl border-slate-200 bg-white text-slate-900"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-slate-700">Slug</Label>
            <Input
              value={slug}
              onChange={(event) =>
                setSlug(event.target.value.toLowerCase().replace(/\s+/g, "-"))
              }
              className="h-11 rounded-xl border-slate-200 bg-white text-slate-900"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700">Room code</Label>
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              className="h-11 rounded-xl border-slate-200 bg-white text-slate-900"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="font-medium text-slate-900">Active room</p>
              <p className="text-sm text-slate-500">
                When off, new players cannot join with the room code.
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="font-medium text-slate-900">Invite-only room</p>
              <p className="text-sm text-slate-500">
                Require a room-specific allowlist entry in addition to the code.
              </p>
            </div>
            <Switch checked={allowlistEnabled} onCheckedChange={setAllowlistEnabled} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() =>
            runAction("save", async () => {
              const result = await adminUpdateRoomAction({
                roomId: room.id,
                name,
                slug,
                code,
                isActive,
                allowlistEnabled,
              });

              if (!result.success) {
                toast.error(result.message);
                return;
              }

              toast.success(result.message);

              if (result.data?.roomSlug && result.data.roomSlug !== room.slug) {
                router.push(`/admin/rooms/${result.data.roomSlug}`);
              }

              router.refresh();
            })
          }
          className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
        >
          {isPending && pendingAction === "save" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save Room
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            runAction("recalculate", async () => {
              const result = await adminRecalculateAction(room.slug);

              if (!result.success) {
                toast.error(result.message);
                return;
              }

              toast.success(result.message);
              router.refresh();
            })
          }
          className="rounded-xl border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          {isPending && pendingAction === "recalculate" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <RefreshCcw className="size-4" />
          )}
          Recalculate This Leaderboard
        </Button>
      </div>
    </div>
  );
}

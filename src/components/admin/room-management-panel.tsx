"use client";

import { useState, useTransition } from "react";
import { ArrowRight, LoaderCircle, PencilLine, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { adminCreateRoomAction, adminUpdateRoomAction } from "@/actions/admin";
import { LoadingLink } from "@/components/navigation/loading-link";
import { useAppLoading } from "@/components/providers/app-loading-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getRoomAdminMatchesPath,
  getRoomAdminOverviewPath,
  getRoomAdminResultsPath,
} from "@/lib/rooms";
import type { AdminRoomListItemView } from "@/lib/types";

type RoomManagementPanelProps = {
  rooms: AdminRoomListItemView[];
};

type RoomFormState = {
  roomId?: string;
  name: string;
  slug: string;
  code: string;
  isActive: boolean;
  allowlistEnabled: boolean;
};

const defaultFormState: RoomFormState = {
  name: "",
  slug: "",
  code: "",
  isActive: true,
  allowlistEnabled: true,
};

export function RoomManagementPanel({ rooms }: RoomManagementPanelProps) {
  const router = useRouter();
  const { beginLoading, endLoading } = useAppLoading();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<AdminRoomListItemView | null>(null);
  const [form, setForm] = useState<RoomFormState>(defaultFormState);
  const [isPending, startTransition] = useTransition();

  const openCreateDialog = () => {
    setSelectedRoom(null);
    setForm(defaultFormState);
    setIsDialogOpen(true);
  };

  const openEditDialog = (room: AdminRoomListItemView) => {
    setSelectedRoom(room);
    setForm({
      roomId: room.id,
      name: room.name,
      slug: room.slug,
      code: room.code,
      isActive: room.isActive,
      allowlistEnabled: room.allowlistEnabled,
    });
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="surface-card space-y-6 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <p className="font-heading text-2xl text-slate-900">Room management</p>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Create new groups, adjust room codes, and jump into room-specific admin tools.
            </p>
          </div>
          <Button
            type="button"
            onClick={openCreateDialog}
            className="h-11 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            <PlusCircle className="size-4" />
            Create Room
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="interactive-surface flex flex-col gap-5 rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="font-heading text-xl text-slate-900">{room.name}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-xs uppercase tracking-[0.18em] text-slate-600">
                      /{room.slug}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-xs uppercase tracking-[0.18em] text-slate-600">
                      {room.code}
                    </span>
                  </div>
                </div>
                <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <span className="font-medium text-slate-900">{room.memberCount}</span> members
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <span className="font-medium text-slate-900">{room.inviteCount}</span> invites
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    {room.allowlistEnabled ? "Allowlist on" : "Allowlist off"}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    {room.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openEditDialog(room)}
                  className="w-full rounded-xl border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <PencilLine className="size-4" />
                  Edit
                </Button>
                <Button
                  asChild
                  className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                >
                  <LoadingLink
                    href={getRoomAdminOverviewPath(room.slug)}
                    message="Opening room admin"
                  >
                    Open
                    <ArrowRight className="size-4" />
                  </LoadingLink>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-xl border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <LoadingLink
                    href={getRoomAdminMatchesPath(room.slug)}
                    message="Opening fixtures"
                  >
                    Fixtures
                  </LoadingLink>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-xl border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <LoadingLink
                    href={getRoomAdminResultsPath(room.slug)}
                    message="Opening results"
                  >
                    Results
                  </LoadingLink>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setSelectedRoom(null);
            setForm(defaultFormState);
          }
        }}
      >
        <DialogContent className="border-slate-200 bg-white text-slate-900">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {selectedRoom ? "Edit room" : "Create room"}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Every room has its own code, invite list, and leaderboard.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Room name</Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                className="h-11 rounded-xl border-slate-200 bg-white text-slate-900"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-700">Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      slug: event.target.value.toLowerCase().replace(/\s+/g, "-"),
                    }))
                  }
                  className="h-11 rounded-xl border-slate-200 bg-white text-slate-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Room code</Label>
                <Input
                  value={form.code}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      code: event.target.value.toUpperCase(),
                    }))
                  }
                  className="h-11 rounded-xl border-slate-200 bg-white text-slate-900"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="font-medium text-slate-900">Active room</p>
                  <p className="text-sm text-slate-500">Inactive rooms cannot be joined.</p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({ ...current, isActive: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="font-medium text-slate-900">Room allowlist</p>
                  <p className="text-sm text-slate-500">Require invited Google emails.</p>
                </div>
                <Switch
                  checked={form.allowlistEnabled}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({ ...current, allowlistEnabled: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <Button
            type="button"
            disabled={
              isPending || !form.name.trim() || !form.slug.trim() || !form.code.trim()
            }
            onClick={() => {
              beginLoading(selectedRoom ? "Updating room" : "Creating room");

              startTransition(async () => {
                const result = selectedRoom
                  ? await adminUpdateRoomAction({
                      roomId: form.roomId,
                      name: form.name,
                      slug: form.slug,
                      code: form.code,
                      isActive: form.isActive,
                      allowlistEnabled: form.allowlistEnabled,
                    })
                  : await adminCreateRoomAction({
                      name: form.name,
                      slug: form.slug,
                      code: form.code,
                      isActive: form.isActive,
                      allowlistEnabled: form.allowlistEnabled,
                    });

                if (!result.success) {
                  endLoading();
                  toast.error(result.message);
                  return;
                }

                toast.success(result.message);
                setIsDialogOpen(false);
                setSelectedRoom(null);
                setForm(defaultFormState);
                router.refresh();
                endLoading();
              });
            }}
            className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {selectedRoom ? "Save Room" : "Create Room"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

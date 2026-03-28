"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, MailPlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  adminRemoveAllowedEmailAction,
  adminToggleAllowedEmailAction,
  adminUpsertAllowedEmailAction,
} from "@/actions/admin";
import { useAppLoading } from "@/components/providers/app-loading-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type AllowlistEntry = {
  id: string;
  email: string;
  isActive: boolean;
};

type AllowlistPanelProps = {
  entries: AllowlistEntry[];
};

export function AllowlistPanel({ entries }: AllowlistPanelProps) {
  const router = useRouter();
  const { beginLoading, endLoading } = useAppLoading();
  const [email, setEmail] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="surface-card space-y-5 p-6">
      <div className="space-y-1">
        <p className="font-heading text-xl text-slate-900">Email Allowlist</p>
        <p className="text-sm text-slate-500">
          Invite Google accounts directly so the room stays private even if the code leaks.
        </p>
      </div>

      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          setPendingKey("create");
          beginLoading("Updating room access");

          startTransition(async () => {
            const result = await adminUpsertAllowedEmailAction({
              email,
              isActive: true,
            });

            setPendingKey(null);

            if (!result.success) {
              endLoading();
              toast.error(result.message);
              return;
            }

            toast.success(result.message);
            setEmail("");
            router.refresh();
            endLoading();
          });
        }}
      >
        <Input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="friend@example.com"
          className="h-11 rounded-xl border-slate-200 bg-white text-slate-900"
        />
        <Button
          type="submit"
          disabled={!email.trim() || (isPending && pendingKey === "create")}
          className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
        >
          {isPending && pendingKey === "create" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <MailPlus className="size-4" />
          )}
          Add Email
        </Button>
      </form>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="interactive-surface flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-slate-900">{entry.email}</p>
              <p className="text-sm text-slate-500">
                {entry.isActive ? "Active invite" : "Inactive invite"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={entry.isActive}
                onCheckedChange={(checked) => {
                  setPendingKey(entry.id);
                  beginLoading("Updating room access");

                  startTransition(async () => {
                    const result = await adminToggleAllowedEmailAction({
                      id: entry.id,
                      isActive: checked,
                    });

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
                }}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setPendingKey(`remove-${entry.id}`);
                  beginLoading("Updating room access");

                  startTransition(async () => {
                    const result = await adminRemoveAllowedEmailAction({ id: entry.id });

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
                }}
                className="rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                {isPending && pendingKey === `remove-${entry.id}` ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

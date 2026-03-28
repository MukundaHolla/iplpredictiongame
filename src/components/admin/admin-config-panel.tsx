"use client";

import { useState, useTransition } from "react";
import { Gauge, LoaderCircle, RefreshCcw, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  adminRecalculateAction,
  adminSeedFixturesAction,
  adminUpdateConfigAction,
} from "@/actions/admin";
import { useAppLoading } from "@/components/providers/app-loading-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type AdminConfigPanelProps = {
  config: {
    defaultCutoffMinutes: number;
    allowlistEnabled: boolean;
    predictionsRevealMode: "AFTER_CUTOFF" | "AFTER_MATCH_START" | "AFTER_SETTLEMENT";
  };
};

export function AdminConfigPanel({ config }: AdminConfigPanelProps) {
  const router = useRouter();
  const { beginLoading, endLoading } = useAppLoading();
  const [defaultCutoffMinutes, setDefaultCutoffMinutes] = useState(
    String(config.defaultCutoffMinutes),
  );
  const [allowlistEnabled, setAllowlistEnabled] = useState(config.allowlistEnabled);
  const [predictionsRevealMode, setPredictionsRevealMode] = useState(
    config.predictionsRevealMode,
  );
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = (key: string, handler: () => Promise<void>) => {
    setPendingAction(key);
    beginLoading("Getting the game ready for you");
    startTransition(async () => {
      await handler();
      setPendingAction(null);
      endLoading();
    });
  };

  return (
    <div className="surface-card space-y-6 p-6">
      <div className="space-y-1">
        <p className="font-heading text-xl text-slate-900">Game Controls</p>
        <p className="text-sm text-slate-500">
          Tune cutoff timing, reveal policy, and the private-room security rules.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="default-cutoff" className="text-slate-700">
            Default cutoff minutes
          </Label>
          <Input
            id="default-cutoff"
            value={defaultCutoffMinutes}
            onChange={(event) => setDefaultCutoffMinutes(event.target.value)}
            className="h-11 rounded-xl border-slate-200 bg-white text-slate-900"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700">Prediction reveal mode</Label>
          <Select
            value={predictionsRevealMode}
            onValueChange={(value) =>
              setPredictionsRevealMode(
                value as AdminConfigPanelProps["config"]["predictionsRevealMode"],
              )
            }
          >
            <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white text-slate-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AFTER_CUTOFF">After cutoff</SelectItem>
              <SelectItem value="AFTER_MATCH_START">After match start</SelectItem>
              <SelectItem value="AFTER_SETTLEMENT">After settlement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-slate-900">Email allowlist</p>
              <p className="text-sm text-slate-500">
                Require invited Google emails in addition to the room code.
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
              const result = await adminUpdateConfigAction({
                defaultCutoffMinutes: Number(defaultCutoffMinutes),
                allowlistEnabled,
                predictionsRevealMode,
              });

              if (!result.success) {
                toast.error(result.message);
                return;
              }

              toast.success(result.message);
              router.refresh();
            })
          }
          className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
        >
          {isPending && pendingAction === "save" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Gauge className="size-4" />
          )}
          Save Config
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            runAction("seed", async () => {
              const result = await adminSeedFixturesAction();

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
          {isPending && pendingAction === "seed" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <UploadCloud className="size-4" />
          )}
          Seed Official Fixtures
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            runAction("recalculate", async () => {
              const result = await adminRecalculateAction();

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
          Recalculate Leaderboard
        </Button>
      </div>
    </div>
  );
}

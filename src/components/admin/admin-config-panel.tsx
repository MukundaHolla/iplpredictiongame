"use client";

import { useState, useTransition } from "react";
import { Gauge, LoaderCircle, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
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

type AdminConfigPanelProps = {
  config: {
    defaultCutoffMinutes: number;
    predictionsRevealMode: "AFTER_CUTOFF" | "AFTER_MATCH_START" | "AFTER_SETTLEMENT";
  };
};

export function AdminConfigPanel({ config }: AdminConfigPanelProps) {
  const router = useRouter();
  const { beginLoading, endLoading } = useAppLoading();
  const [defaultCutoffMinutes, setDefaultCutoffMinutes] = useState(
    String(config.defaultCutoffMinutes),
  );
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
        <p className="font-heading text-2xl text-slate-900">Global season controls</p>
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Tune default cutoffs and prediction reveal policy across every room.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
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
            <p className="text-xs text-slate-500">
              Applied when newly seeded or manually created matches do not set their own cutoff.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
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
            <p className="text-xs text-slate-500">
              Controls when room members can see aggregate picks after the pick window closes.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          onClick={() =>
            runAction("save", async () => {
              const result = await adminUpdateConfigAction({
                defaultCutoffMinutes: Number(defaultCutoffMinutes),
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
          className="h-11 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700"
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
          className="h-11 w-full rounded-xl border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          {isPending && pendingAction === "seed" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <UploadCloud className="size-4" />
          )}
          Seed Official Fixtures
        </Button>
      </div>
    </div>
  );
}

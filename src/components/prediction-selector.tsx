"use client";

import { startTransition, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { upsertPredictionAction } from "@/actions/predictions";
import { ConfettiBurst } from "@/components/confetti-burst";
import { useAppLoading } from "@/components/providers/app-loading-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TeamOption = {
  id: string;
  shortCode: string;
  name: string;
};

type PredictionSelectorProps = {
  roomSlug: string;
  matchId: string;
  teamA: TeamOption;
  teamB: TeamOption;
  selectedTeamId: string | null;
  disabled: boolean;
};

export function PredictionSelector({
  roomSlug,
  matchId,
  teamA,
  teamB,
  selectedTeamId,
  disabled,
}: PredictionSelectorProps) {
  const router = useRouter();
  const { beginLoading, endLoading } = useAppLoading();
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null);
  const [confettiBurstKey, setConfettiBurstKey] = useState(0);

  const teams = [teamA, teamB];

  return (
    <>
      <ConfettiBurst burstKey={confettiBurstKey} />

      <div className="grid gap-3 sm:grid-cols-2">
        {teams.map((team) => {
          const isSelected = selectedTeamId === team.id;
          const isPending = pendingTeamId === team.id;

          return (
            <Button
              key={team.id}
              type="button"
              variant="ghost"
              disabled={disabled || Boolean(pendingTeamId)}
              onClick={() => {
                setPendingTeamId(team.id);
                beginLoading("Saving your pick");

                startTransition(async () => {
                  const result = await upsertPredictionAction({
                    roomSlug,
                    matchId,
                    predictedTeamId: team.id,
                  });

                  setPendingTeamId(null);

                  if (!result.success) {
                    endLoading();
                    toast.error(result.message);
                    return;
                  }

                  setConfettiBurstKey((current) => current + 1);
                  toast.success(result.message ?? `${team.shortCode} locked in.`);
                  router.refresh();
                  endLoading();
                });
              }}
              className={cn(
                "h-14 rounded-2xl border text-left transition-all duration-200",
                isSelected
                  ? "border-blue-300 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100"
                  : "border-slate-200 bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50/60",
              )}
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span>
                  <span className="font-heading text-lg">{team.shortCode}</span>
                  <span className="mt-1 block text-xs text-slate-500">{team.name}</span>
                </span>
                {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              </span>
            </Button>
          );
        })}
      </div>
    </>
  );
}

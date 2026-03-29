"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MatchCardView } from "@/lib/types";
import { cn } from "@/lib/utils";

type RoomPicksPanelProps = {
  match: Pick<
    MatchCardView,
    "id" | "teamA" | "teamB" | "individualPicks" | "showRoomPicksDisclosure"
  >;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
};

function getPickBadgeClass(
  match: RoomPicksPanelProps["match"],
  pickedTeamId: string,
) {
  if (pickedTeamId === match.teamA.id) {
    return "border-blue-100 bg-blue-50 text-blue-700";
  }

  return "border-amber-100 bg-amber-50 text-amber-700";
}

export function RoomPicksPanel({
  match,
  collapsible = false,
  defaultOpen = false,
  className,
}: RoomPicksPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!match.showRoomPicksDisclosure) {
    return null;
  }

  const shouldRenderBody = !collapsible || isOpen;

  return (
    <div className={cn("space-y-3", className)}>
      {collapsible ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          className="w-full justify-between rounded-2xl border-slate-200 bg-white px-4 py-6 text-left text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium">
            <Users className="size-4" />
            {isOpen ? "Hide room picks" : "Show room picks"}
          </span>
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </Button>
      ) : null}

      {shouldRenderBody ? (
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-900">Room picks</p>
            <p className="text-xs text-slate-500">
              {match.individualPicks.length} submitted
            </p>
          </div>

          {match.individualPicks.length > 0 ? (
            <div className="grid gap-3">
              {match.individualPicks.map((pick) => {
                return (
                  <div
                    key={`${match.id}-${pick.userId}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="size-10 border border-slate-200">
                        <AvatarImage src={pick.image ?? undefined} alt={pick.name} />
                        <AvatarFallback className="bg-blue-50 font-heading text-blue-700">
                          {pick.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="truncate text-sm font-medium text-slate-900">{pick.name}</p>
                    </div>
                    <Badge
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs",
                        getPickBadgeClass(match, pick.pickedTeamId),
                      )}
                    >
                      {pick.pickedTeamShortCode}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
              No picks yet in this room.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

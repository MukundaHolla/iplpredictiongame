"use client";

import { useMemo, useState, useTransition } from "react";
import { differenceInMinutes } from "date-fns";
import { CalendarClock, LoaderCircle, PencilLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { adminUpdateMatchAction } from "@/actions/admin";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTimeLocalValue, formatMatchDateTime } from "@/lib/time";

type AdminFixtureRow = {
  id: string;
  matchNumber: number | null;
  stage: "LEAGUE" | "QUALIFIER_1" | "ELIMINATOR" | "QUALIFIER_2" | "FINAL";
  startTimeUtc: string;
  cutoffTimeUtc: string;
  venue: string | null;
  city: string | null;
  teamA: { shortCode: string; name: string };
  teamB: { shortCode: string; name: string };
};

type AdminFixtureTableProps = {
  matches: AdminFixtureRow[];
};

export function AdminFixtureTable({ matches }: AdminFixtureTableProps) {
  const router = useRouter();
  const { beginLoading, endLoading } = useAppLoading();
  const [selectedMatch, setSelectedMatch] = useState<AdminFixtureRow | null>(null);
  const [form, setForm] = useState({
    stage: "LEAGUE",
    venue: "",
    city: "",
    startTimeLocal: "",
    cutoffMinutes: "60",
  });
  const [isPending, startTransition] = useTransition();

  const sortedMatches = useMemo(
    () =>
      [...matches].sort(
        (left, right) =>
          new Date(left.startTimeUtc).getTime() - new Date(right.startTimeUtc).getTime(),
      ),
    [matches],
  );

  return (
    <>
      <div className="surface-card overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-slate-500">Match</TableHead>
              <TableHead className="text-slate-500">Fixture</TableHead>
              <TableHead className="text-slate-500">Start</TableHead>
              <TableHead className="text-slate-500">Venue</TableHead>
              <TableHead className="text-slate-500">Cutoff</TableHead>
              <TableHead className="text-right text-slate-500">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMatches.map((match) => {
              const start = formatMatchDateTime(new Date(match.startTimeUtc));
              const cutoffMinutes = Math.abs(
                differenceInMinutes(
                  new Date(match.startTimeUtc),
                  new Date(match.cutoffTimeUtc),
                ),
              );

              return (
                <TableRow key={match.id} className="border-slate-200 hover:bg-blue-50/60">
                  <TableCell className="font-heading text-slate-900">
                    {match.matchNumber ? `#${match.matchNumber}` : match.stage}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">
                        {match.teamA.shortCode} vs {match.teamB.shortCode}
                      </p>
                      <p className="text-xs text-slate-500">{match.stage.replaceAll("_", " ")}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {start.date}
                    <span className="ml-2 text-slate-500">{start.time}</span>
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {match.city ? `${match.city} · ${match.venue ?? "Venue TBA"}` : match.venue ?? "Venue TBA"}
                  </TableCell>
                  <TableCell className="text-slate-700">{cutoffMinutes} min</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setSelectedMatch(match);
                        setForm({
                          stage: match.stage,
                          venue: match.venue ?? "",
                          city: match.city ?? "",
                          startTimeLocal: formatDateTimeLocalValue(new Date(match.startTimeUtc)),
                          cutoffMinutes: String(cutoffMinutes),
                        });
                      }}
                      className="rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <PencilLine className="size-4" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(selectedMatch)} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <DialogContent className="border-slate-200 bg-white text-slate-900">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              Edit {selectedMatch?.teamA.shortCode} vs {selectedMatch?.teamB.shortCode}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Update the fixture timing, venue, city, and per-match cutoff minutes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-700">Stage</Label>
                <Select
                  value={form.stage}
                  onValueChange={(value) => setForm((current) => ({ ...current, stage: value }))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEAGUE">League</SelectItem>
                    <SelectItem value="QUALIFIER_1">Qualifier 1</SelectItem>
                    <SelectItem value="ELIMINATOR">Eliminator</SelectItem>
                    <SelectItem value="QUALIFIER_2">Qualifier 2</SelectItem>
                    <SelectItem value="FINAL">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">Cutoff minutes</Label>
                <Input
                  value={form.cutoffMinutes}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, cutoffMinutes: event.target.value }))
                  }
                  className="h-11 rounded-xl border-slate-200 bg-white text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Start time (IST)</Label>
              <Input
                type="datetime-local"
                value={form.startTimeLocal}
                onChange={(event) =>
                  setForm((current) => ({ ...current, startTimeLocal: event.target.value }))
                }
                className="h-11 rounded-xl border-slate-200 bg-white text-slate-900"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-700">Venue</Label>
                <Input
                  value={form.venue}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, venue: event.target.value }))
                  }
                  className="h-11 rounded-xl border-slate-200 bg-white text-slate-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">City</Label>
                <Input
                  value={form.city}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, city: event.target.value }))
                  }
                  className="h-11 rounded-xl border-slate-200 bg-white text-slate-900"
                />
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => {
              if (!selectedMatch) return;
              beginLoading("Saving the fixture update");

              startTransition(async () => {
                const result = await adminUpdateMatchAction({
                  matchId: selectedMatch.id,
                  stage: form.stage,
                  venue: form.venue || null,
                  city: form.city || null,
                  startTimeLocal: form.startTimeLocal,
                  cutoffMinutes: Number(form.cutoffMinutes),
                });

                if (!result.success) {
                  endLoading();
                  toast.error(result.message);
                  return;
                }

                toast.success(result.message);
                setSelectedMatch(null);
                router.refresh();
                endLoading();
              });
            }}
            className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <CalendarClock className="size-4" />
            )}
            Save Fixture
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

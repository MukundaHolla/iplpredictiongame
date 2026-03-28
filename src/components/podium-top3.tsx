"use client";

import { Crown, Sparkles, Trophy } from "lucide-react";
import { motion } from "framer-motion";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { LeaderboardRowView } from "@/lib/types";

type PodiumTop3Props = {
  entries: LeaderboardRowView[];
};

const podiumOrder = [1, 0, 2];

export function PodiumTop3({ entries }: PodiumTop3Props) {
  const podiumEntries = podiumOrder.map((index) => entries[index]).filter(Boolean);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {podiumEntries.map((entry, index) => {
        const isWinner = entry.rank === 1;

        return (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.35 }}
            className={`surface-card relative overflow-hidden p-6 ${
              isWinner ? "lg:-translate-y-3" : ""
            }`}
          >
            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <span className="glass-chip text-xs uppercase tracking-[0.2em]">
                  Rank #{entry.rank}
                </span>
                {isWinner ? (
                  <Crown className="size-5 text-amber-500" />
                ) : entry.rank === 2 ? (
                  <Trophy className="size-5 text-slate-500" />
                ) : (
                  <Sparkles className="size-5 text-orange-500" />
                )}
              </div>
              <div className="flex items-center gap-4">
                <Avatar className="size-16 border border-slate-200">
                  <AvatarImage src={entry.image ?? undefined} alt={entry.name} />
                  <AvatarFallback className="bg-blue-50 font-heading text-blue-700">
                    {entry.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="font-heading text-2xl text-slate-900">{entry.name}</h3>
                  <p className="text-sm text-slate-600">
                    {entry.points} pts · {Math.round(entry.accuracy * 100)}% accuracy
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-heading text-lg text-slate-900">{entry.correct}</p>
                  <p className="text-slate-500">Correct</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-heading text-lg text-slate-900">{entry.missed}</p>
                  <p className="text-slate-500">Missed</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-heading text-lg text-slate-900">{entry.currentStreak}</p>
                  <p className="text-slate-500">Streak</p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

"use client";

import { Swords, Clock, Zap, Coins } from "lucide-react";
import type { InstantDungeon } from "@/lib/types";
import { buildExerciseMap } from "@/lib/data/exercises";
import { usePlayer } from "@/lib/store/usePlayer";
import { Button } from "@/components/ui/Button";
import { RankBadge } from "@/components/ui/RankBadge";

export function DungeonCard({ dungeon, onEnter }: { dungeon: InstantDungeon; onEnter: () => void }) {
  const exercises = usePlayer((s) => s.exercises);
  const mp = usePlayer((s) => s.player.mp);
  const exMap = buildExerciseMap(exercises);

  return (
    <div className="flex flex-col rounded-panel border border-border bg-bg-800/60 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 font-display text-base font-bold text-text-hi">
            <Swords size={16} className="text-accent" />
            {dungeon.name}
          </div>
          <p className="mt-1 max-w-xs font-mono text-[11px] text-text-low">{dungeon.theme}</p>
        </div>
        <RankBadge rank={dungeon.difficulty} size="sm" />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {dungeon.exercises.map((e) => (
          <span key={e.exerciseId} className="rounded-full border border-border bg-bg-900/60 px-2 py-0.5 font-mono text-[10px] text-text-mid">
            {exMap[e.exerciseId]?.name ?? e.exerciseId} ×{e.target}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3 font-mono text-[10px] text-text-mid">
        <span className="flex items-center gap-1">
          <Clock size={11} /> {Math.round(dungeon.timeLimitSec / 60)}m
        </span>
        <span className="flex items-center gap-1 text-accent-2">
          <Zap size={11} /> {dungeon.mpCost} MP
        </span>
        <span className="flex items-center gap-1 text-accent">+{dungeon.rewardExp} EXP</span>
        <span className="flex items-center gap-1 text-warning">
          <Coins size={11} /> {dungeon.rewardGold}
        </span>
      </div>

      <Button className="mt-3" disabled={mp < dungeon.mpCost} onClick={onEnter}>
        {mp < dungeon.mpCost ? "Insufficient Focus" : "Enter Gate"}
      </Button>
    </div>
  );
}

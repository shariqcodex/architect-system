"use client";

import type { MuscleGroup, MuscleId } from "@/lib/types";
import { MUSCLE_IDS } from "@/lib/types";
import { rankForExp, tierProgress } from "@/lib/engine/muscles";
import { rankColors } from "@/lib/design/tokens";
import { ExpBar } from "@/components/ui/ExpBar";
import { RankBadge } from "@/components/ui/RankBadge";

export function MuscleRanks({ muscles }: { muscles: Record<MuscleId, MuscleGroup> }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {MUSCLE_IDS.map((id) => {
        const m = muscles[id]!;
        const prog = tierProgress(m.exp);
        const rank = rankForExp(m.exp);
        return (
          <div key={id} className="flex items-center gap-3 rounded-inset border border-border bg-bg-800/50 px-3 py-2">
            <RankBadge rank={rank} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-semibold text-text-hi">{m.label}</span>
                <span className="font-mono text-[10px] text-text-low">
                  {prog.next ? `${Math.round(prog.ratio * 100)}%→${prog.next}` : "MAX"}
                </span>
              </div>
              <ExpBar className="mt-1" value={prog.current} max={prog.needed || 1} height={4} color={rankColors[rank]} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

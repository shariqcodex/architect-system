"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Timer } from "lucide-react";
import type { InstantDungeon } from "@/lib/types";
import { usePlayer } from "@/lib/store/usePlayer";
import { buildExerciseMap } from "@/lib/data/exercises";
import { Button } from "@/components/ui/Button";
import { ExpBar } from "@/components/ui/ExpBar";
import { formatCountdown } from "@/lib/engine/dates";

export function DungeonRunner({ dungeon, onClose }: { dungeon: InstantDungeon; onClose: () => void }) {
  const exercises = usePlayer((s) => s.exercises);
  const complete = usePlayer((s) => s.completeDungeon);
  const exMap = buildExerciseMap(exercises);

  const [progress, setProgress] = useState<Record<string, number>>(
    Object.fromEntries(dungeon.exercises.map((e) => [e.exerciseId, 0])),
  );
  const [remaining, setRemaining] = useState(dungeon.timeLimitSec * 1000);
  const [outcome, setOutcome] = useState<"running" | "clear" | "fail">("running");

  useEffect(() => {
    if (outcome !== "running") return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1000) {
          clearInterval(t);
          setOutcome("fail");
          return 0;
        }
        return r - 1000;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [outcome]);

  const allDone = dungeon.exercises.every((e) => (progress[e.exerciseId] ?? 0) >= e.target);

  const bump = (id: string, amt: number, target: number) =>
    setProgress((p) => ({ ...p, [id]: Math.min(target, (p[id] ?? 0) + amt) }));

  const finish = () => {
    complete(dungeon);
    setOutcome("clear");
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg overflow-hidden rounded-panel border border-border-hi bg-bg-800 shadow-glow"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="font-display text-sm font-bold uppercase tracking-widest text-accent">{dungeon.name}</div>
            <div className="font-mono text-[10px] text-text-low">Rank {dungeon.difficulty} Gate</div>
          </div>
          <button onClick={onClose} className="text-text-low hover:text-text-hi">
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          {outcome === "running" && (
            <>
              <div className="mb-3 flex items-center justify-center gap-2 font-mono text-lg font-bold text-text-hi">
                <Timer size={16} className={remaining < 60000 ? "text-danger" : "text-accent-2"} />
                <span className={remaining < 60000 ? "text-danger" : ""}>{formatCountdown(remaining)}</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {dungeon.exercises.map((e) => {
                  const ex = exMap[e.exerciseId];
                  const cur = progress[e.exerciseId] ?? 0;
                  const done = cur >= e.target;
                  const step = ex?.unit === "km" ? 0.5 : 5;
                  return (
                    <div key={e.exerciseId} className="rounded-inset border border-border bg-bg-900/60 p-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 font-display text-sm text-text-hi">
                          {done && <Check size={14} className="text-success" />}
                          {ex?.name ?? e.exerciseId}
                        </span>
                        <span className="font-mono text-xs text-text-mid">
                          {cur} / {e.target}
                        </span>
                      </div>
                      <ExpBar className="mt-2" value={cur} max={e.target} height={4} color={done ? "var(--success)" : "var(--accent-2)"} />
                      {!done && (
                        <div className="mt-2 flex gap-1.5">
                          <Button size="sm" variant="subtle" onClick={() => bump(e.exerciseId, step, e.target)}>
                            +{step}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => bump(e.exerciseId, e.target - cur, e.target)}>
                            done
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <Button className="mt-4 w-full" variant="success" disabled={!allDone} onClick={finish}>
                Clear Dungeon (+{dungeon.rewardExp} EXP)
              </Button>
            </>
          )}

          {outcome === "clear" && (
            <div className="py-6 text-center">
              <div className="font-display text-xl font-bold uppercase tracking-widest text-success">Gate Cleared</div>
              <p className="mt-2 font-mono text-xs text-text-mid">
                +{dungeon.rewardExp} EXP · +{dungeon.rewardGold} gold
              </p>
              <Button className="mt-4" onClick={onClose}>
                Return
              </Button>
            </div>
          )}

          {outcome === "fail" && (
            <div className="py-6 text-center">
              <div className="font-display text-xl font-bold uppercase tracking-widest text-danger">Time Expired</div>
              <p className="mt-2 font-mono text-xs text-text-mid">The gate collapsed. No rewards earned.</p>
              <Button className="mt-4" variant="ghost" onClick={onClose}>
                Retreat
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

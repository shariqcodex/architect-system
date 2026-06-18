"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { usePlayer } from "@/lib/store/usePlayer";
import { buildExerciseMap } from "@/lib/data/exercises";
import { questProgress } from "@/lib/engine/quests";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { ExpBar } from "@/components/ui/ExpBar";
import { CountdownTimer } from "@/components/quest/CountdownTimer";

export function DailyQuestCard() {
  const quest = usePlayer((s) => s.quest);
  const exercises = usePlayer((s) => s.exercises);
  const log = usePlayer((s) => s.logExercise);
  const debuff = usePlayer((s) => s.debuff);
  const [manual, setManual] = useState<Record<string, string>>({});

  if (!quest) return null;
  const exMap = buildExerciseMap(exercises);
  const progress = questProgress(quest);
  const done = quest.status === "complete";
  const failed = quest.status === "failed";

  const setManualVal = (id: string, v: string) => setManual((m) => ({ ...m, [id]: v }));

  return (
    <Panel
      corners
      title={
        <span className="flex items-center gap-2">
          {quest.isPenaltyQuest ? (
            <span className="text-danger">[ Penalty Quest ]</span>
          ) : (
            <span>[ Daily Quest ]</span>
          )}
        </span>
      }
      action={<CountdownTimer />}
    >
      {debuff.active && (
        <div className="mb-3 rounded-inset border border-danger/30 bg-danger/10 px-3 py-2 font-mono text-[11px] text-danger">
          DEBUFF ACTIVE · EXP ×{debuff.expMultiplier.toFixed(2)} — {debuff.reason}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-xs text-text-mid">
          Reward: <span className="text-accent">+{quest.rewardExp.toLocaleString()} EXP</span>
        </span>
        <span className="font-mono text-xs text-text-mid">{Math.round(progress * 100)}%</span>
      </div>
      <ExpBar value={progress} max={1} color={done ? "var(--success)" : "var(--accent)"} height={6} />

      <div className="mt-4 flex flex-col gap-2.5">
        {quest.items.map((it) => {
          const ex = exMap[it.exerciseId];
          if (!ex) return null;
          const complete = it.completed >= it.target;
          const ratio = Math.min(1, it.completed / it.target);
          const unit = ex.unit === "reps" ? "" : ` ${ex.unit}`;
          const step5 = ex.unit === "km" ? 1 : 5;
          const step1 = ex.unit === "km" ? 0.5 : 1;
          return (
            <div key={it.exerciseId} className="rounded-inset border border-border bg-bg-800/50 p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-display text-sm font-semibold text-text-hi">
                  {complete && <Check size={15} className="text-success" />}
                  {ex.name}
                </span>
                <span className="font-mono text-xs tabular-nums text-text-mid">
                  {it.completed % 1 === 0 ? it.completed : it.completed.toFixed(1)} / {it.target}
                  {unit}
                </span>
              </div>
              <div className="mt-2">
                <ExpBar value={ratio} max={1} height={4} color={complete ? "var(--success)" : "var(--accent-2)"} />
              </div>
              {!done && !failed && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <Button size="sm" variant="subtle" onClick={() => log(it.exerciseId, step1)} disabled={complete}>
                    +{step1}
                  </Button>
                  <Button size="sm" variant="subtle" onClick={() => log(it.exerciseId, step5)} disabled={complete}>
                    +{step5}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => log(it.exerciseId, Math.max(step1, it.target - it.completed))}
                    disabled={complete}
                    title="Complete the remainder"
                  >
                    + set
                  </Button>
                  <div className="ml-auto flex items-center gap-1">
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={manual[it.exerciseId] ?? ""}
                      onChange={(e) => setManualVal(it.exerciseId, e.target.value)}
                      className="h-8 w-16 rounded-inset border border-border bg-bg-900 px-2 text-right font-mono text-xs text-text-hi outline-none focus:border-border-hi"
                    />
                    <Button
                      size="sm"
                      variant="primary"
                      className="h-8 w-8 !px-0"
                      aria-label="Log manual amount"
                      onClick={() => {
                        const v = parseFloat(manual[it.exerciseId] ?? "");
                        if (!Number.isNaN(v) && v > 0) {
                          log(it.exerciseId, v);
                          setManualVal(it.exerciseId, "");
                        }
                      }}
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {done && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 rounded-inset border border-success/40 bg-success/10 px-3 py-2.5 text-center font-display text-sm font-semibold uppercase tracking-widest text-success"
        >
          Daily Quest Complete
        </motion.div>
      )}
      {failed && (
        <div className="mt-4 rounded-inset border border-danger/40 bg-danger/10 px-3 py-2.5 text-center font-display text-sm font-semibold uppercase tracking-widest text-danger">
          Quest Failed — Penalty Applied
        </div>
      )}
    </Panel>
  );
}

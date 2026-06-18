"use client";

import { useState } from "react";
import { Skull, Plus, Crown } from "lucide-react";
import { usePlayer } from "@/lib/store/usePlayer";
import { buildExerciseMap } from "@/lib/data/exercises";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { ExpBar } from "@/components/ui/ExpBar";

export function BossPanel() {
  const bosses = usePlayer((s) => s.bosses);
  const exercises = usePlayer((s) => s.exercises);
  const createBoss = usePlayer((s) => s.createBoss);
  const exMap = buildExerciseMap(exercises);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [exId, setExId] = useState(exercises[0]?.id ?? "");
  const [benchmark, setBenchmark] = useState("");

  const submit = () => {
    const b = parseFloat(benchmark);
    if (!name.trim() || Number.isNaN(b) || b <= 0) return;
    const ex = exMap[exId];
    createBoss({
      name: name.trim(),
      description: `Defeat by performing ${b} ${ex?.unit ?? "reps"} of ${ex?.name ?? exId} in one effort.`,
      exerciseId: exId,
      benchmark: b,
      rewardTitle: `${name.trim()} Slayer`,
    });
    setName("");
    setBenchmark("");
    setOpen(false);
  };

  return (
    <Panel
      corners
      title="[ Boss Battles ]"
      action={
        <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
          <Plus size={14} /> Summon
        </Button>
      }
    >
      {open && (
        <div className="mb-4 grid grid-cols-1 gap-2 rounded-inset border border-border bg-bg-900/50 p-3 sm:grid-cols-2">
          <input
            placeholder="Boss name (e.g. The Pull-up Wraith)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 rounded-inset border border-border bg-bg-900 px-3 font-mono text-xs text-text-hi outline-none focus:border-border-hi sm:col-span-2"
          />
          <select
            value={exId}
            onChange={(e) => setExId(e.target.value)}
            className="h-9 rounded-inset border border-border bg-bg-900 px-2 font-mono text-xs text-text-hi outline-none focus:border-border-hi"
          >
            {exercises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Benchmark (e.g. 50)"
            value={benchmark}
            onChange={(e) => setBenchmark(e.target.value)}
            className="h-9 rounded-inset border border-border bg-bg-900 px-3 text-right font-mono text-xs text-text-hi outline-none focus:border-border-hi"
          />
          <Button size="sm" className="sm:col-span-2" onClick={submit}>
            Summon Boss
          </Button>
        </div>
      )}

      {bosses.length === 0 ? (
        <p className="font-mono text-xs text-text-low">
          No active bosses. Summon one to turn a long-term goal into a battle with an HP bar.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {bosses.map((b) => {
            const ex = exMap[b.exerciseId];
            const hpLeft = Math.max(0, b.maxHp - b.progress);
            return (
              <div
                key={b.id}
                className={`rounded-inset border p-3 ${b.defeated ? "border-success/40 bg-success/5" : "border-danger/30 bg-danger/5"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-display text-sm font-bold text-text-hi">
                    {b.defeated ? <Crown size={15} className="text-success" /> : <Skull size={15} className="text-danger" />}
                    {b.name}
                  </span>
                  <span className="font-mono text-[10px] text-text-low">
                    {b.defeated ? "DEFEATED" : `HP ${hpLeft}/${b.maxHp}`}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10px] text-text-low">{b.description}</p>
                <ExpBar
                  className="mt-2"
                  value={b.progress}
                  max={b.maxHp}
                  height={6}
                  color={b.defeated ? "var(--success)" : "var(--danger)"}
                />
                <div className="mt-1 font-mono text-[10px] text-text-mid">
                  Best effort: {b.progress} / {b.benchmark} {ex?.unit ?? "reps"} · Reward title:{" "}
                  <span className="text-accent">{b.rewardTitle}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

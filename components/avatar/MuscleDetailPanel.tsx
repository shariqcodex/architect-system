"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { MuscleId } from "@/lib/types";
import { usePlayer } from "@/lib/store/usePlayer";
import { getMuscleVisualState, tierProgress } from "@/lib/engine/muscles";
import { buildExerciseMap } from "@/lib/data/exercises";
import { lastNDays, localDateKey } from "@/lib/engine/dates";
import { Panel } from "@/components/ui/Panel";
import { ExpBar } from "@/components/ui/ExpBar";
import { RankBadge } from "@/components/ui/RankBadge";
import { rankColors } from "@/lib/design/tokens";

export function MuscleDetailPanel({
  muscleId,
  onClose,
}: {
  muscleId: MuscleId;
  onClose: () => void;
}) {
  const muscle = usePlayer((s) => s.muscles[muscleId]);
  const exercises = usePlayer((s) => s.exercises);
  const logs = usePlayer((s) => s.logs);

  const vis = getMuscleVisualState(muscle!);
  const prog = tierProgress(muscle!.exp);
  const color = rankColors[prog.rank];

  const recommended = useMemo(
    () =>
      exercises
        .map((e) => ({ e, w: e.muscleWeights[muscleId] ?? 0 }))
        .filter((x) => x.w > 0)
        .sort((a, b) => b.w - a.w)
        .slice(0, 4)
        .map((x) => x.e),
    [exercises, muscleId],
  );

  // 14-day EXP-into-this-muscle sparkline.
  const spark = useMemo(() => {
    const exMap = buildExerciseMap(exercises);
    const days = lastNDays(14);
    const totals: Record<string, number> = {};
    for (const d of days) totals[d] = 0;
    for (const log of logs) {
      const ex = exMap[log.exerciseId];
      if (!ex) continue;
      const w = ex.muscleWeights[muscleId];
      if (!w) continue;
      const key = localDateKey(new Date(log.date));
      if (key in totals) totals[key] = (totals[key] ?? 0) + log.expGained * w;
    }
    return days.map((d) => totals[d] ?? 0);
  }, [logs, exercises, muscleId]);

  const sparkMax = Math.max(1, ...spark);
  const sparkPts = spark
    .map((v, i) => {
      const x = (i / (spark.length - 1)) * 100;
      const y = 28 - (v / sparkMax) * 26;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <Panel
        corners
        title={muscle!.label}
        action={
          <button onClick={onClose} className="text-text-low hover:text-text-hi" aria-label="Close">
            <X size={16} />
          </button>
        }
      >
        <div className="flex items-center gap-3">
          <RankBadge rank={prog.rank} size="lg" />
          <div className="flex-1">
            <div className="font-mono text-[11px] text-text-mid">
              {prog.next ? `Rank ${prog.rank} → ${prog.next}` : "Maximum Tier"}
            </div>
            <ExpBar
              className="mt-1"
              value={prog.current}
              max={prog.needed || prog.current || 1}
              color={color}
              rightLabel={
                prog.next
                  ? `${Math.round(prog.current).toLocaleString()} / ${prog.needed.toLocaleString()}`
                  : "MAX"
              }
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat label="Total EXP" value={Math.round(muscle!.exp).toLocaleString()} />
          <Stat
            label="Fatigue"
            value={`${Math.round(muscle!.fatigue)}%`}
            valueColor={muscle!.fatigue > 60 ? "var(--danger)" : muscle!.fatigue > 35 ? "var(--warning)" : "var(--success)"}
          />
        </div>

        {muscle!.fatigue > 60 && (
          <p className="mt-2 rounded-inset border border-danger/30 bg-danger/10 px-2.5 py-1.5 font-mono text-[11px] text-danger">
            Overworked. EXP gains reduced — rest this muscle.
          </p>
        )}

        <div className="mt-4">
          <div className="mb-1 font-display text-[11px] uppercase tracking-widest text-text-low">
            14-day activity
          </div>
          <svg viewBox="0 0 100 30" className="h-10 w-full" preserveAspectRatio="none">
            <polyline
              points={sparkPts}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        <div className="mt-3">
          <div className="mb-1.5 font-display text-[11px] uppercase tracking-widest text-text-low">
            Recommended training
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recommended.map((e) => (
              <span
                key={e.id}
                className="rounded-full border border-border bg-bg-800/70 px-2.5 py-1 font-mono text-[11px] text-text-mid"
              >
                {e.name}
              </span>
            ))}
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-inset border border-border bg-bg-800/60 px-3 py-2">
      <div className="font-display text-[10px] uppercase tracking-widest text-text-low">{label}</div>
      <div className="font-mono text-lg font-bold tabular-nums" style={{ color: valueColor ?? "var(--text-hi)" }}>
        {value}
      </div>
    </div>
  );
}

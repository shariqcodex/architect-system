"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RotateCw } from "lucide-react";
import type { MuscleId } from "@/lib/types";
import { usePlayer } from "@/lib/store/usePlayer";
import { getMuscleVisualState } from "@/lib/engine/muscles";
import { FIGURE, HEAD, SILHOUETTE, VIEWBOX } from "@/components/avatar/figureShapes";
import { MagicCircle } from "@/components/avatar/MagicCircle";
import { MuscleDetailPanel } from "@/components/avatar/MuscleDetailPanel";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

type View = "front" | "back";

export function BodyAvatar() {
  const muscles = usePlayer((s) => s.muscles);
  const lastTrained = usePlayer((s) => s.lastTrainedMuscles);
  const [view, setView] = useState<View>("front");
  const [selected, setSelected] = useState<MuscleId | null>(null);

  const shapes = FIGURE[view];
  const visibleIds = useMemo(() => Object.keys(shapes) as MuscleId[], [shapes]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="relative flex flex-col items-center">
        <div className="mb-2 flex w-full items-center justify-between">
          <span className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-text-mid">
            {view === "front" ? "Anterior" : "Posterior"} View
          </span>
          <Button size="sm" variant="ghost" onClick={() => setView((v) => (v === "front" ? "back" : "front"))}>
            <RotateCw size={14} /> Flip
          </Button>
        </div>

        <div className="relative w-full max-w-[300px]">
          <MagicCircle />
          <svg viewBox={VIEWBOX} className="relative z-10 h-auto w-full" role="img" aria-label="Body avatar">
            <defs>
              {visibleIds.map((id) => {
                const v = getMuscleVisualState(muscles[id]!);
                return (
                  <filter key={`glow-${id}`} id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation={v.glow} result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                );
              })}
              <radialGradient id="floor" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(61,169,252,0.18)" />
                <stop offset="100%" stopColor="rgba(61,169,252,0)" />
              </radialGradient>
            </defs>

            {/* floor glow */}
            <ellipse cx="120" cy="452" rx="78" ry="12" fill="url(#floor)" />

            {/* body silhouette */}
            <path d={SILHOUETTE[view]} fill="#0C1422" stroke="rgba(120,160,220,0.18)" strokeWidth={1.2} />

            {/* head */}
            <path d={HEAD} fill="#0E1828" stroke="rgba(120,160,220,0.18)" strokeWidth={1.2} />

            {/* muscle groups */}
            {visibleIds.map((id) => {
              const muscle = muscles[id]!;
              const v = getMuscleVisualState(muscle);
              const shape = shapes[id]!;
              const isSel = selected === id;
              const pulsing = lastTrained.includes(id);
              const { x, y } = shape.centroid;
              return (
                <motion.g
                  key={`${view}-${id}`}
                  style={{ cursor: "pointer", transformOrigin: `${x}px ${y}px` }}
                  filter={v.glow > 0 ? `url(#glow-${id})` : undefined}
                  onClick={() => setSelected((cur) => (cur === id ? null : id))}
                  initial={false}
                  animate={
                    pulsing
                      ? { scale: [v.scale, v.scale * 1.08, v.scale], opacity: [1, 0.85, 1] }
                      : { scale: v.scale, opacity: 1 }
                  }
                  transition={pulsing ? { duration: 0.7, repeat: 1 } : { duration: 0.3 }}
                >
                  {shape.paths.map((d, i) => (
                    <path
                      key={i}
                      d={d}
                      fill={v.fill}
                      fillOpacity={0.92}
                      stroke={isSel ? "var(--accent-2)" : `${v.fill}`}
                      strokeWidth={isSel ? 2 : 0.8}
                      strokeOpacity={isSel ? 1 : 0.5}
                    />
                  ))}
                  {/* fatigue overlay */}
                  {v.fatigueOverlay > 0 &&
                    shape.paths.map((d, i) => (
                      <path key={`f-${i}`} d={d} fill="#FF4D6D" fillOpacity={v.fatigueOverlay} pointerEvents="none" />
                    ))}
                </motion.g>
              );
            })}
          </svg>
        </div>

        {/* rank legend */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[10px]">
          {(["E", "D", "C", "B", "A", "S", "SS"] as const).map((r) => (
            <span key={r} className="flex items-center gap-1 font-mono text-text-low">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: `var(--rank-${r}, #888)` }}
              />
              {r}
            </span>
          ))}
        </div>
      </div>

      <div className={cn(selected ? "" : "hidden lg:block")}>
        {selected ? (
          <MuscleDetailPanel muscleId={selected} onClose={() => setSelected(null)} />
        ) : (
          <div className="flex h-full min-h-[260px] items-center justify-center rounded-panel border border-dashed border-border bg-bg-800/40 p-6 text-center">
            <p className="font-mono text-xs leading-relaxed text-text-low">
              Tap a muscle to inspect its rank, EXP, fatigue, and recommended training.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

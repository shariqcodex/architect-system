"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

export interface FluxPhase {
  at: number; // 0–100 threshold at which this phase becomes active
  label: string;
}

interface ProgressiveFluxLoaderProps {
  value: number; // 0–100
  phases?: FluxPhase[];
  className?: string;
  /** Slim mode = thin bar (used by the route/tab loader). */
  slim?: boolean;
  showPercent?: boolean;
}

const DEFAULT_PHASES: FluxPhase[] = [
  { at: 0, label: "accessing" },
  { at: 40, label: "decrypting" },
  { at: 75, label: "rendering" },
  { at: 100, label: "online" },
];

function activePhase(phases: FluxPhase[], value: number): FluxPhase {
  let current = phases[0];
  for (const p of phases) if (value >= p.at) current = p;
  return current;
}

/** Phase label whose letters fly in one-by-one each time the phase changes. */
function PhaseLabel({ label }: { label: string }) {
  const chars = useMemo(() => label.split(""), [label]);
  return (
    <span className="relative inline-flex font-display text-[11px] font-semibold uppercase tracking-[0.34em] text-accent-2">
      <span className="mr-1 text-text-low">[</span>
      <AnimatePresence mode="wait">
        <motion.span key={label} className="inline-flex">
          {chars.map((c, i) => (
            <motion.span
              key={`${label}-${i}`}
              initial={{ y: 9, opacity: 0, filter: "blur(4px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -9, opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.22, delay: i * 0.035, ease: "easeOut" }}
              className="inline-block"
            >
              {c === " " ? " " : c}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
      <span className="ml-1 text-text-low">]</span>
    </span>
  );
}

export function ProgressiveFluxLoader({
  value,
  phases = DEFAULT_PHASES,
  className,
  slim = false,
  showPercent = true,
}: ProgressiveFluxLoaderProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const phase = activePhase(phases, clamped);

  return (
    <div className={cn("w-full", className)}>
      {!slim && (
        <div className="mb-2 flex items-center justify-between">
          <PhaseLabel label={phase.label} />
          {showPercent && (
            <span className="font-mono text-[11px] tabular-nums text-text-mid">
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full border border-border bg-bg-900/80",
          slim ? "h-[3px] rounded-none border-0 bg-bg-900/40" : "h-2.5",
        )}
      >
        {/* flux fill */}
        <motion.div
          className="relative h-full"
          style={{
            background:
              "linear-gradient(90deg, var(--accent) 0%, var(--accent-2) 55%, #BDF3FF 100%)",
            backgroundSize: "200% 100%",
            boxShadow: "0 0 14px rgba(0,224,255,0.65), 0 0 4px rgba(61,169,252,0.9)",
          }}
          initial={false}
          animate={{ width: `${clamped}%`, backgroundPositionX: ["0%", "200%"] }}
          transition={{
            width: { duration: 0.28, ease: "easeOut" },
            backgroundPositionX: { duration: 1.6, ease: "linear", repeat: Infinity },
          }}
        >
          {/* travelling shimmer — the "flux" */}
          <motion.span
            className="pointer-events-none absolute inset-y-0 w-1/3"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
              filter: "blur(2px)",
            }}
            animate={{ x: ["-120%", "320%"] }}
            transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity }}
          />
          {/* leading edge spark */}
          <span
            className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 translate-x-1/2 rounded-full bg-white"
            style={{ boxShadow: "0 0 10px 2px rgba(0,224,255,0.9)" }}
          />
        </motion.div>
      </div>
    </div>
  );
}

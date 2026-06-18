"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface ExpBarProps {
  value: number;
  max: number;
  color?: string;
  /** Optional second stop for a left→right gradient fill (e.g. monarch blue→violet). */
  gradientTo?: string;
  label?: string;
  rightLabel?: string;
  height?: number;
  className?: string;
}

export function ExpBar({
  value,
  max,
  color = "var(--accent)",
  gradientTo,
  label,
  rightLabel,
  height = 8,
  className,
}: ExpBarProps) {
  const ratio = max <= 0 ? 1 : Math.max(0, Math.min(1, value / max));
  const fill = gradientTo
    ? `linear-gradient(90deg, ${color}, ${gradientTo})`
    : `linear-gradient(90deg, ${color}bb, ${color})`;
  const glowColor = gradientTo ?? color;
  return (
    <div className={cn("w-full", className)}>
      {(label || rightLabel) && (
        <div className="mb-1 flex items-center justify-between font-mono text-[11px] text-text-mid">
          <span>{label}</span>
          <span className="tabular-nums">{rightLabel}</span>
        </div>
      )}
      <div
        className="relative w-full overflow-hidden rounded-full border border-border bg-bg-900/80"
        style={{ height }}
      >
        <motion.div
          className="relative h-full overflow-hidden rounded-full"
          style={{
            background: fill,
            boxShadow: `0 0 14px ${glowColor}77`,
          }}
          initial={false}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)",
              animation: "shimmer 2.5s ease-in-out infinite",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

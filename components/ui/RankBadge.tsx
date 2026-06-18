"use client";

import { cn } from "@/lib/utils/cn";
import { rankColors } from "@/lib/design/tokens";
import type { Rank } from "@/lib/types";

interface RankBadgeProps {
  rank: Rank;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const dims: Record<NonNullable<RankBadgeProps["size"]>, { box: number; font: number; glow: number }> = {
  sm: { box: 26, font: 12, glow: 8 },
  md: { box: 38, font: 16, glow: 12 },
  lg: { box: 58, font: 26, glow: 18 },
  xl: { box: 76, font: 34, glow: 26 },
};

const HIGH_RANKS: Rank[] = ["A", "S", "SS"];

// Monarch Protocol: ranks are inscribed in a glowing hexagonal sigil.
export function RankBadge({ rank, size = "md", className }: RankBadgeProps) {
  const color = rankColors[rank];
  const isHigh = HIGH_RANKS.includes(rank);
  const { box, font, glow } = dims[size];
  const dim = rank === "E" ? 0 : glow;

  return (
    <div
      className={cn(
        "relative inline-flex flex-shrink-0 items-center justify-center",
        isHigh && "animate-rank-pulse",
        className,
      )}
      style={{ width: box, height: box }}
      aria-label={`Rank ${rank}`}
    >
      <svg
        viewBox="0 0 100 100"
        width={box}
        height={box}
        className="absolute inset-0"
        aria-hidden="true"
        style={{ filter: dim ? `drop-shadow(0 0 ${dim}px ${color}aa)` : "none" }}
      >
        <polygon
          points="50,4 93,27 93,73 50,96 7,73 7,27"
          fill={`${color}1f`}
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <polygon
          points="50,15 82,33 82,67 50,85 18,67 18,33"
          fill="none"
          stroke={`${color}40`}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="relative font-display font-bold leading-none"
        style={{ color, fontSize: font, textShadow: dim ? `0 0 10px ${color}aa` : "none" }}
      >
        {rank}
      </span>
    </div>
  );
}

import type { MuscleGroup, MuscleId, Rank } from "@/lib/types";
import { RANK_ORDER } from "@/lib/types";
import { rankColors, rankVisuals } from "@/lib/design/tokens";
import { MUSCLE_LABELS } from "@/lib/data/exercises";

// ============================================================================
// Muscle EXP → tier, fatigue, and avatar visual-state helpers. Pure functions.
// ============================================================================

// Cumulative EXP required to REACH each rank (rising curve). Rank is derived.
export const MUSCLE_TIER_THRESHOLDS: Record<Rank, number> = {
  E: 0,
  D: 500,
  C: 1500,
  B: 4000,
  A: 9000,
  S: 20000,
  SS: 45000,
};

export function rankForExp(exp: number): Rank {
  let result: Rank = "E";
  for (const r of RANK_ORDER) {
    if (exp >= MUSCLE_TIER_THRESHOLDS[r]) result = r;
  }
  return result;
}

/** Progress (0–1) within the current tier toward the next tier. */
export function tierProgress(exp: number): {
  rank: Rank;
  next: Rank | null;
  current: number;
  needed: number;
  ratio: number;
} {
  const rank = rankForExp(exp);
  const idx = RANK_ORDER.indexOf(rank);
  const next = idx < RANK_ORDER.length - 1 ? RANK_ORDER[idx + 1]! : null;

  const floor = MUSCLE_TIER_THRESHOLDS[rank];
  if (!next) {
    return { rank, next: null, current: exp - floor, needed: 0, ratio: 1 };
  }
  const ceil = MUSCLE_TIER_THRESHOLDS[next];
  const current = exp - floor;
  const needed = ceil - floor;
  return { rank, next, current, needed, ratio: Math.min(1, current / needed) };
}

export interface MuscleVisualState {
  fill: string;
  glow: number; // blur radius in px for the SVG glow filter
  scale: number; // figure scale at this tier
  fatigueOverlay: number; // 0–1 red overlay opacity
  rank: Rank;
}

/** Returns { fill, glow, scale } derived from rank + fatigue. */
export function getMuscleVisualState(muscle: MuscleGroup): MuscleVisualState {
  const rank = rankForExp(muscle.exp);
  const v = rankVisuals[rank];
  // Heavy fatigue slightly desaturates / shrinks the apparent development.
  const fatigueFactor = 1 - (muscle.fatigue / 100) * 0.18;
  return {
    fill: rankColors[rank],
    glow: v.glow,
    scale: 1 + (v.scale - 1) * fatigueFactor,
    fatigueOverlay: Math.max(0, (muscle.fatigue - 45) / 55) * 0.55,
    rank,
  };
}

// ---------------------------------------------------------------------------
// Fatigue
// ---------------------------------------------------------------------------

/** EXP multiplier from current fatigue: diminishing returns when overworked. */
export function fatigueExpMultiplier(fatigue: number): number {
  // 0 fatigue → 1.0; 100 fatigue → ~0.35
  return Math.max(0.35, 1 - (fatigue / 100) * 0.65);
}

/** Fatigue added for a given EXP gain into a muscle. */
export function fatigueFromExp(expGain: number): number {
  return Math.min(40, expGain / 12);
}

/** Decay fatigue based on hours rested since last update. */
export function decayedFatigue(fatigue: number, hoursRested: number): number {
  // ~25 fatigue points recovered per 24h.
  const recovered = (hoursRested / 24) * 25;
  return Math.max(0, fatigue - recovered);
}

export function createInitialMuscle(id: MuscleId, startingExp = 0): MuscleGroup {
  return {
    id,
    label: MUSCLE_LABELS[id],
    exp: startingExp,
    rank: rankForExp(startingExp),
    fatigue: 0,
    lastTrained: new Date().toISOString(),
  };
}

import type { Rank } from "@/lib/types";
import { RANK_ORDER } from "@/lib/types";

// ============================================================================
// Player leveling math — pure, testable functions.
// ============================================================================

/** EXP required to advance FROM `level` TO `level + 1`. Rising curve. */
export function expForLevel(level: number): number {
  const lvl = Math.max(1, Math.floor(level));
  return Math.round(100 * Math.pow(lvl, 1.45) + 40 * lvl);
}

/** Total cumulative EXP needed to reach the start of `level` from level 1. */
export function totalExpToReachLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += expForLevel(l);
  return total;
}

export interface LevelState {
  level: number;
  exp: number; // exp into the current level
  expToNext: number; // exp needed to finish the current level
  levelsGained: number;
}

/**
 * Given a current level + exp-into-level and an EXP gain, returns the resulting
 * level state, handling multi-level overflow.
 */
export function applyExp(level: number, expIntoLevel: number, gain: number): LevelState {
  let lvl = level;
  let exp = expIntoLevel + gain;
  let levelsGained = 0;

  let need = expForLevel(lvl);
  while (exp >= need) {
    exp -= need;
    lvl += 1;
    levelsGained += 1;
    need = expForLevel(lvl);
  }

  return { level: lvl, exp, expToNext: need, levelsGained };
}

/** Removes EXP (for penalties), clamping at level 1 / 0 exp (never negative level). */
export function removeExp(level: number, expIntoLevel: number, loss: number): LevelState {
  let lvl = level;
  let exp = expIntoLevel - loss;

  while (exp < 0 && lvl > 1) {
    lvl -= 1;
    exp += expForLevel(lvl);
  }
  if (exp < 0) exp = 0;

  return { level: lvl, exp, expToNext: expForLevel(lvl), levelsGained: 0 };
}

/** Overall Hunter Rank derived from level. Never stored — always derived. */
export function hunterRankForLevel(level: number): Rank {
  if (level >= 100) return "SS";
  if (level >= 80) return "S";
  if (level >= 55) return "A";
  if (level >= 35) return "B";
  if (level >= 20) return "C";
  if (level >= 10) return "D";
  return "E";
}

export function rankIndex(rank: Rank): number {
  return RANK_ORDER.indexOf(rank);
}

/** Stat points granted on a level-up (slightly more at milestone levels). */
export function statPointsForLevelUp(newLevel: number): number {
  return newLevel % 10 === 0 ? 5 : 3;
}

/** Max HP / MP derived from level + allocated stats. */
export function maxHpForStats(level: number, vit: number): number {
  return 100 + level * 10 + vit * 8;
}

export function maxMpForStats(level: number, int: number): number {
  return 50 + level * 4 + int * 6;
}

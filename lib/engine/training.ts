import type { Exercise, MuscleGroup, MuscleId, StatKey } from "@/lib/types";
import { fatigueExpMultiplier, fatigueFromExp } from "@/lib/engine/muscles";

// ============================================================================
// Converts "logged N units of an exercise" into EXP + muscle/stat/fatigue
// deltas, honoring per-muscle fatigue diminishing returns and global debuff.
// Pure function.
// ============================================================================

export interface TrainingResult {
  baseExp: number; // before debuff
  totalExp: number; // player EXP (after debuff)
  muscleExp: Partial<Record<MuscleId, number>>; // per-muscle EXP added
  muscleFatigue: Partial<Record<MuscleId, number>>; // per-muscle fatigue added
  statGains: Partial<Record<StatKey, number>>;
}

export function computeTraining(
  exercise: Exercise,
  amount: number,
  muscles: Record<MuscleId, MuscleGroup>,
  globalMultiplier = 1,
): TrainingResult {
  const baseExp = exercise.expPerUnit * amount;

  const muscleExp: Partial<Record<MuscleId, number>> = {};
  const muscleFatigue: Partial<Record<MuscleId, number>> = {};
  let effectiveTotal = 0;

  for (const [id, weight] of Object.entries(exercise.muscleWeights) as [MuscleId, number][]) {
    const muscle = muscles[id];
    const fatigue = muscle ? muscle.fatigue : 0;
    const portion = baseExp * weight;
    const gained = portion * fatigueExpMultiplier(fatigue) * globalMultiplier;
    muscleExp[id] = Math.round(gained);
    muscleFatigue[id] = fatigueFromExp(portion);
    effectiveTotal += gained;
  }

  const statGains: Partial<Record<StatKey, number>> = {};
  for (const [stat, weight] of Object.entries(exercise.statWeights) as [StatKey, number][]) {
    // small passive stat XP — accumulates toward auto stat nudges (handled in store)
    statGains[stat] = (statGains[stat] ?? 0) + weight * amount;
  }

  return {
    baseExp: Math.round(baseExp),
    totalExp: Math.round(effectiveTotal),
    muscleExp,
    muscleFatigue,
    statGains,
  };
}

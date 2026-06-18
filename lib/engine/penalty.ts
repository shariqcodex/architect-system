import type { Debuff, PenaltyDifficulty } from "@/lib/types";

// ============================================================================
// Penalty engine — failure detection & application. Pure functions.
// ============================================================================

export interface PenaltyConfig {
  expLossRatio: number; // fraction of CURRENT-level exp lost
  debuffHours: number; // duration of reduced-gain debuff
  debuffMultiplier: number; // exp multiplier while debuffed
  spawnPenaltyQuest: boolean; // harder quest next day
}

export const PENALTY_CONFIG: Record<PenaltyDifficulty, PenaltyConfig> = {
  casual: {
    expLossRatio: 0,
    debuffHours: 12,
    debuffMultiplier: 0.85,
    spawnPenaltyQuest: false,
  },
  standard: {
    expLossRatio: 0.1,
    debuffHours: 24,
    debuffMultiplier: 0.7,
    spawnPenaltyQuest: true,
  },
  hardcore: {
    expLossRatio: 0.25,
    debuffHours: 24,
    debuffMultiplier: 0.5,
    spawnPenaltyQuest: true,
  },
};

export function buildDebuff(difficulty: PenaltyDifficulty, now: Date = new Date()): Debuff {
  const cfg = PENALTY_CONFIG[difficulty];
  const expires = new Date(now.getTime() + cfg.debuffHours * 3_600_000);
  return {
    active: true,
    reason: cfg.spawnPenaltyQuest
      ? "Penalty Zone — clear the Penalty Quest to lift the debuff."
      : "Penalty Zone — recover by completing today's quest.",
    expiresAt: cfg.spawnPenaltyQuest ? null : expires.toISOString(),
    expMultiplier: cfg.debuffMultiplier,
  };
}

export function isDebuffExpired(debuff: Debuff | null, now: Date = new Date()): boolean {
  if (!debuff || !debuff.active) return true;
  if (!debuff.expiresAt) return false; // cleared only by penalty quest
  return new Date(debuff.expiresAt).getTime() <= now.getTime();
}

export const NO_DEBUFF: Debuff = {
  active: false,
  reason: "",
  expiresAt: null,
  expMultiplier: 1,
};

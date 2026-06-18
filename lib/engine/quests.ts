import type { DailyQuest, DailyQuestItem, UserProfile } from "@/lib/types";
import { localDateKey } from "@/lib/engine/dates";

// ============================================================================
// Daily Quest generation, scaling, completion. Pure functions.
// ============================================================================

export interface QuestTemplateItem {
  exerciseId: string;
  baseTarget: number; // target at scale level 1
}

export interface QuestTemplate {
  items: QuestTemplateItem[];
  /** Growth per player level, e.g. 0.04 = +4% per level above 1. */
  scalingRate: number;
}

// Default seed quota mirrors the anime (push-ups / sit-ups / squats / run),
// but baseTarget is calibrated down for onboarding and scaled by level.
export const DEFAULT_QUEST_TEMPLATE: QuestTemplate = {
  items: [
    { exerciseId: "pushups", baseTarget: 30 },
    { exerciseId: "situps", baseTarget: 30 },
    { exerciseId: "squats", baseTarget: 30 },
    { exerciseId: "running", baseTarget: 2 },
  ],
  scalingRate: 0.05,
};

/** Multiplier applied to baseTargets from onboarding experience level. */
export function calibrationFromProfile(profile: UserProfile | null): number {
  if (!profile) return 1;
  let m = 1;
  if (profile.experience === "novice") m = 0.7;
  else if (profile.experience === "advanced") m = 1.4;
  // gentle age tapering for older brackets
  if (profile.age >= 55) m *= 0.7;
  else if (profile.age >= 40) m *= 0.85;
  else if (profile.age <= 17) m *= 0.8;
  return m;
}

export function scaleTarget(
  baseTarget: number,
  level: number,
  scalingRate: number,
  calibration: number,
): number {
  const scaled = baseTarget * calibration * (1 + (level - 1) * scalingRate);
  // Round running (km) to 0.5; everything else to whole numbers.
  return Math.max(1, Math.round(scaled));
}

export function generateDailyQuest(
  template: QuestTemplate,
  level: number,
  profile: UserProfile | null,
  date: Date = new Date(),
): DailyQuest {
  const calibration = calibrationFromProfile(profile);
  const items: DailyQuestItem[] = template.items.map((it) => ({
    exerciseId: it.exerciseId,
    target: scaleTarget(it.baseTarget, level, template.scalingRate, calibration),
    completed: 0,
  }));

  // Reward scales with total work + level.
  const totalTarget = items.reduce((s, it) => s + it.target, 0);
  const rewardExp = Math.round(80 + totalTarget * 1.5 + level * 12);

  return {
    date: localDateKey(date),
    items,
    status: "active",
    rewardExp,
  };
}

/** A harder penalty quest for the day after a failure. */
export function generatePenaltyQuest(base: DailyQuest): DailyQuest {
  return {
    ...base,
    items: base.items.map((it) => ({ ...it, target: Math.round(it.target * 1.3), completed: 0 })),
    rewardExp: Math.round(base.rewardExp * 1.2),
    status: "active",
    isPenaltyQuest: true,
  };
}

export function isQuestComplete(quest: DailyQuest): boolean {
  return quest.items.every((it) => it.completed >= it.target);
}

export function questProgress(quest: DailyQuest): number {
  if (quest.items.length === 0) return 0;
  const ratios = quest.items.map((it) =>
    it.target <= 0 ? 1 : Math.min(1, it.completed / it.target),
  );
  return ratios.reduce((s, r) => s + r, 0) / ratios.length;
}

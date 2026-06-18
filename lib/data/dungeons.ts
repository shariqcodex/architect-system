import type { InstantDungeon, Rank, UserProfile } from "@/lib/types";
import { calibrationFromProfile } from "@/lib/engine/quests";

// Preset Instant Dungeons, scaled to player level + profile. Age-appropriate
// intensity comes through the calibration factor.
export function presetDungeons(level: number, profile: UserProfile | null): InstantDungeon[] {
  const cal = calibrationFromProfile(profile);
  const s = (n: number) => Math.max(1, Math.round(n * cal * (1 + (level - 1) * 0.04)));

  const mk = (
    id: string,
    name: string,
    theme: string,
    difficulty: Rank,
    mpCost: number,
    timeLimitSec: number,
    exercises: { exerciseId: string; target: number }[],
    rewardExp: number,
    rewardGold: number,
  ): InstantDungeon => ({ id, name, theme, difficulty, mpCost, timeLimitSec, exercises, rewardExp, rewardGold });

  return [
    mk(
      "goblin-den",
      "Goblin Den",
      "A low-rank clearing gate. Fast and frantic.",
      "D",
      10,
      300,
      [
        { exerciseId: "pushups", target: s(20) },
        { exerciseId: "squats", target: s(20) },
        { exerciseId: "burpees", target: s(10) },
      ],
      220,
      60,
    ),
    mk(
      "cerberus-run",
      "Cerberus Run",
      "A conditioning gate. Keep moving or be caught.",
      "C",
      18,
      420,
      [
        { exerciseId: "jump-squats", target: s(25) },
        { exerciseId: "situps", target: s(30) },
        { exerciseId: "running", target: Math.max(1, Math.round(2 * cal)) },
      ],
      360,
      110,
    ),
    mk(
      "iron-fortress",
      "Iron Fortress",
      "A strength gate. Heavy resistance throughout.",
      "B",
      26,
      540,
      [
        { exerciseId: "pushups", target: s(40) },
        { exerciseId: "pullups", target: s(8) },
        { exerciseId: "lunges", target: s(30) },
        { exerciseId: "plank", target: s(60) },
      ],
      560,
      180,
    ),
  ];
}

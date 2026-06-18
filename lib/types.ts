// ============================================================================
// THE SYSTEM — Core domain model
// ============================================================================

export type Rank = "E" | "D" | "C" | "B" | "A" | "S" | "SS"; // SS = "National Level" endgame

export const RANK_ORDER: Rank[] = ["E", "D", "C", "B", "A", "S", "SS"];

export type MuscleId =
  | "shoulders"
  | "chest"
  | "biceps"
  | "triceps"
  | "forearms"
  | "back"
  | "core"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves";

export const MUSCLE_IDS: MuscleId[] = [
  "shoulders",
  "chest",
  "biceps",
  "triceps",
  "forearms",
  "back",
  "core",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
];

export interface MuscleGroup {
  id: MuscleId;
  label: string;
  exp: number; // cumulative EXP into this muscle
  rank: Rank; // derived from exp via threshold curve
  fatigue: number; // 0–100; rises with training, decays with rest
  lastTrained: string; // ISO date
}

export interface PlayerStats {
  STR: number; // strength — resistance volume
  VIT: number; // vitality/stamina — cardio & endurance
  AGI: number; // agility — plyometric/speed work
  INT: number; // earned via consistency/logging streaks
  PER: number; // perception — earned via achievements
}

export type StatKey = keyof PlayerStats;

export interface Player {
  name: string;
  level: number;
  exp: number;
  expToNext: number;
  hunterRank: Rank; // overall rank, derived from level
  hp: number;
  maxHp: number;
  mp: number; // "Focus" — spent on Instant Dungeons
  maxMp: number;
  statPoints: number; // unspent points
  stats: PlayerStats;
  titles: string[];
  activeTitle: string | null;
  streak: number;
  longestStreak: number;
  gold: number; // in-app currency
}

export type ExerciseUnit = "reps" | "seconds" | "km";

export interface Exercise {
  id: string;
  name: string; // e.g. "Push-ups"
  unit: ExerciseUnit;
  muscleWeights: Partial<Record<MuscleId, number>>; // sums roughly to 1.0
  statWeights: Partial<Record<StatKey, number>>;
  expPerUnit: number; // base EXP per rep/sec/km
  custom?: boolean;
}

export interface DailyQuestItem {
  exerciseId: string;
  target: number;
  completed: number;
}

export type QuestStatus = "active" | "complete" | "failed";

export interface DailyQuest {
  date: string; // ISO date (local)
  items: DailyQuestItem[];
  status: QuestStatus;
  rewardExp: number;
  isPenaltyQuest?: boolean;
}

// ---------------------------------------------------------------------------
// AI Coach (Groq) + profile
// ---------------------------------------------------------------------------

export interface UserProfile {
  age: number;
  sex: "male" | "female" | "prefer_not_to_say";
  heightCm?: number;
  weightKg?: number;
  experience: "novice" | "intermediate" | "advanced";
  injuries?: string[]; // free-text limitations the coach must respect
  goals?: string[];
}

export interface AISettings {
  groqApiKey: string | null; // stored via persistence, never bundled
  model: string; // chosen from fetched /models list
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Penalty / difficulty
// ---------------------------------------------------------------------------

export type PenaltyDifficulty = "casual" | "standard" | "hardcore";

export interface Debuff {
  active: boolean;
  reason: string;
  expiresAt: string | null; // ISO; null = cleared by clearing penalty quest
  expMultiplier: number; // e.g. 0.5 = halved gains
}

// ---------------------------------------------------------------------------
// Titles & achievements
// ---------------------------------------------------------------------------

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

// ---------------------------------------------------------------------------
// Boss battle
// ---------------------------------------------------------------------------

export interface Boss {
  id: string;
  name: string;
  description: string;
  exerciseId: string;
  benchmark: number; // target value to defeat (e.g. 50 push-ups in a set)
  progress: number; // best logged value so far
  maxHp: number;
  defeated: boolean;
  rewardTitle: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Instant Dungeon
// ---------------------------------------------------------------------------

export interface DungeonExercise {
  exerciseId: string;
  target: number;
}

export interface InstantDungeon {
  id: string;
  name: string;
  theme: string;
  difficulty: Rank;
  mpCost: number;
  timeLimitSec: number;
  exercises: DungeonExercise[];
  rewardExp: number;
  rewardGold: number;
}

// ---------------------------------------------------------------------------
// History / logs
// ---------------------------------------------------------------------------

export interface LogEntry {
  id: string;
  date: string; // ISO datetime
  exerciseId: string;
  amount: number;
  expGained: number;
  source: "quest" | "manual" | "dungeon" | "boss";
}

export interface Settings {
  penaltyDifficulty: PenaltyDifficulty;
  units: "metric" | "imperial";
  reminderTime: string | null; // "HH:MM" local, or null
  soundEnabled: boolean;
}

// ---------------------------------------------------------------------------
// System notifications
// ---------------------------------------------------------------------------

export type NotificationVariant = "info" | "success" | "alert" | "levelup" | "rankup";

export interface SystemNotice {
  id: string;
  variant: NotificationVariant;
  header: string;
  body: string;
  createdAt: number;
}

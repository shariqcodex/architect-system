import type {
  DailyQuest,
  Debuff,
  Exercise,
  LogEntry,
  MuscleGroup,
  MuscleId,
  Player,
  PlayerStats,
  UserProfile,
} from "@/lib/types";
import { MUSCLE_IDS } from "@/lib/types";
import { rankForExp } from "@/lib/engine/muscles";
import { buildExerciseMap } from "@/lib/data/exercises";

// A compact, serializable snapshot of live player state for the Architect.
export interface PlayerSnapshot {
  name: string;
  level: number;
  hunterRank: string;
  stats: PlayerStats;
  streak: number;
  longestStreak: number;
  debuffActive: boolean;
  muscles: { id: MuscleId; label: string; rank: string; fatigue: number }[];
  weakest: string[];
  recentLogs: { exercise: string; amount: number; when: string }[];
  profile: UserProfile | null;
  todaysQuest: { exercise: string; target: number; completed: number }[] | null;
}

interface SnapshotInput {
  player: Player;
  muscles: Record<MuscleId, MuscleGroup>;
  logs: LogEntry[];
  exercises: Exercise[];
  profile: UserProfile | null;
  debuff: Debuff;
  quest: DailyQuest | null;
}

export function buildPlayerSnapshot(state: SnapshotInput): PlayerSnapshot {
  const exMap = buildExerciseMap(state.exercises);
  const muscles = MUSCLE_IDS.map((id) => {
    const m = state.muscles[id];
    return {
      id,
      label: m.label,
      rank: rankForExp(m.exp),
      fatigue: Math.round(m.fatigue),
    };
  });

  const order = ["E", "D", "C", "B", "A", "S", "SS"];
  const weakest = [...muscles]
    .sort((a, b) => order.indexOf(a.rank) - order.indexOf(b.rank))
    .slice(0, 3)
    .map((m) => `${m.label} (${m.rank})`);

  const recentLogs = state.logs.slice(0, 8).map((l) => ({
    exercise: exMap[l.exerciseId]?.name ?? l.exerciseId,
    amount: l.amount,
    when: l.date.slice(0, 10),
  }));

  return {
    name: state.player.name,
    level: state.player.level,
    hunterRank: state.player.hunterRank,
    stats: state.player.stats,
    streak: state.player.streak,
    longestStreak: state.player.longestStreak,
    debuffActive: state.debuff.active,
    muscles,
    weakest,
    recentLogs,
    profile: state.profile,
    todaysQuest: state.quest
      ? state.quest.items.map((it) => ({
          exercise: exMap[it.exerciseId]?.name ?? it.exerciseId,
          target: it.target,
          completed: it.completed,
        }))
      : null,
  };
}

import type { InstantDungeon, Rank } from "@/lib/types";

// ============================================================================
// JSON contracts for structured AI generation. The model is instructed to
// return JSON ONLY (no prose, no markdown). We validate against live exercise
// IDs before applying anything to game state.
// ============================================================================

const RANKS: Rank[] = ["E", "D", "C", "B", "A", "S", "SS"];

export interface ProposedQuestJSON {
  rationale: string;
  rewardExp: number;
  items: { exerciseId: string; target: number }[];
}

export interface ProposedDungeonJSON {
  name: string;
  theme: string;
  difficulty: Rank;
  mpCost: number;
  timeLimitSec: number;
  rewardExp: number;
  rewardGold: number;
  exercises: { exerciseId: string; target: number }[];
}

export interface ProposedBossJSON {
  name: string;
  description: string;
  exerciseId: string;
  benchmark: number;
  rewardTitle: string;
}

// ---- Architect commands (state-mutating, require user confirmation) -------

export type ArchitectActionType =
  | "regenerate_quest"
  | "reset_all_progress"
  | "reset_item"
  | "set_item"
  | "none";

export interface ArchitectActionJSON {
  action: ArchitectActionType;
  exerciseId?: string | null;
  value?: number | null;
  message: string;
}

/** A validated, ready-to-dispatch command. `action: "none"` means "no command — answer in chat". */
export interface ArchitectAction {
  action: ArchitectActionType;
  exerciseId: string | null;
  value: number | null;
  message: string;
}

export function actionSchemaInstruction(
  questItems: { exerciseId: string; name: string; target: number; completed: number }[],
): string {
  const list =
    questItems.length > 0
      ? questItems
          .map((q) => `${q.exerciseId} ("${q.name}", ${q.completed}/${q.target})`)
          .join(", ")
      : "(no active quest)";
  return `The Hunter may be asking you to MODIFY their Daily Quest. Decide which single command fits, and return ONLY valid JSON (no markdown, no commentary) of shape:
{"action": "regenerate_quest" | "reset_all_progress" | "reset_item" | "set_item" | "none", "exerciseId": string | null, "value": number | null, "message": string}

Commands:
- "regenerate_quest": replace today's quest with a brand-new one ("give me new quests", "change my daily quest", "reroll").
- "reset_all_progress": set every objective's progress back to 0 ("reset all my quests", "wipe my progress").
- "reset_item": set ONE objective's progress back to 0 ("reset my squats"). Put its id in exerciseId.
- "set_item": set ONE objective's progress to a specific number ("set my squats to 50", "I did 20 push-ups, log it as 20 total"). Put its id in exerciseId and the number in value.
- "none": the Hunter is NOT asking to change quest state (a question, advice, chit-chat). Leave exerciseId/value null.

Rules:
- exerciseId MUST be one of the current quest objective ids: ${list}. If none matches, use "none".
- "message": one short in-character sentence describing what you will do (shown above the confirm button). For "none", a brief acknowledgement is fine.`;
}

export function questSchemaInstruction(exerciseIds: string[]): string {
  return `Return ONLY valid JSON (no markdown, no commentary) of shape:
{"rationale": string, "rewardExp": number, "items": [{"exerciseId": string, "target": number}]}
- exerciseId MUST be one of: ${exerciseIds.join(", ")}.
- 3 to 5 items. Targets must be realistic for the player's level, age, fatigue, and weak points.`;
}

export function dungeonSchemaInstruction(exerciseIds: string[]): string {
  return `Return ONLY valid JSON (no markdown, no commentary) of shape:
{"name": string, "theme": string, "difficulty": "E|D|C|B|A|S", "mpCost": number, "timeLimitSec": number, "rewardExp": number, "rewardGold": number, "exercises": [{"exerciseId": string, "target": number}]}
- exerciseId MUST be one of: ${exerciseIds.join(", ")}.
- 3 to 5 exercises. timeLimitSec between 180 and 900. mpCost between 8 and 30. Make it themed and age-appropriate.`;
}

export function bossSchemaInstruction(exerciseIds: string[]): string {
  return `Return ONLY valid JSON (no markdown, no commentary) of shape:
{"name": string, "description": string, "exerciseId": string, "benchmark": number, "rewardTitle": string}
- exerciseId MUST be one of: ${exerciseIds.join(", ")}.
- benchmark = a single-effort target that is challenging but achievable as a long-term goal.`;
}

// ---- safe parsing / validation -------------------------------------------

export function safeParseJSON<T>(raw: string): T | null {
  try {
    // Strip accidental markdown fences if present.
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

export function validateProposedDungeon(
  data: ProposedDungeonJSON | null,
  validIds: Set<string>,
): InstantDungeon | null {
  if (!data || !Array.isArray(data.exercises) || data.exercises.length === 0) return null;
  const exercises = data.exercises
    .filter((e) => validIds.has(e.exerciseId) && Number(e.target) > 0)
    .map((e) => ({ exerciseId: e.exerciseId, target: Math.round(Number(e.target)) }));
  if (exercises.length === 0) return null;
  const difficulty = RANKS.includes(data.difficulty) ? data.difficulty : "C";
  return {
    id: `ai-${Date.now()}`,
    name: String(data.name || "Architect's Gate").slice(0, 48),
    theme: String(data.theme || "A custom gate forged by the System.").slice(0, 160),
    difficulty,
    mpCost: clamp(Number(data.mpCost) || 15, 8, 30),
    timeLimitSec: clamp(Number(data.timeLimitSec) || 420, 180, 900),
    exercises,
    rewardExp: clamp(Number(data.rewardExp) || 300, 80, 2000),
    rewardGold: clamp(Number(data.rewardGold) || 100, 20, 600),
  };
}

export function validateProposedQuest(
  data: ProposedQuestJSON | null,
  validIds: Set<string>,
): { items: { exerciseId: string; target: number }[]; rewardExp: number; rationale: string } | null {
  if (!data || !Array.isArray(data.items)) return null;
  const items = data.items
    .filter((e) => validIds.has(e.exerciseId) && Number(e.target) > 0)
    .map((e) => ({ exerciseId: e.exerciseId, target: Math.round(Number(e.target)) }));
  if (items.length === 0) return null;
  return {
    items,
    rewardExp: clamp(Number(data.rewardExp) || 150, 50, 3000),
    rationale: String(data.rationale || "").slice(0, 400),
  };
}

export function validateProposedBoss(
  data: ProposedBossJSON | null,
  validIds: Set<string>,
): ProposedBossJSON | null {
  if (!data || !validIds.has(data.exerciseId) || !(Number(data.benchmark) > 0)) return null;
  return {
    name: String(data.name || "Nameless Boss").slice(0, 48),
    description: String(data.description || "").slice(0, 200),
    exerciseId: data.exerciseId,
    benchmark: Math.round(Number(data.benchmark)),
    rewardTitle: String(data.rewardTitle || `${data.name} Slayer`).slice(0, 48),
  };
}

export function validateArchitectAction(
  data: ArchitectActionJSON | null,
  validItemIds: Set<string>,
): ArchitectAction | null {
  if (!data) return null;
  const types: ArchitectActionType[] = [
    "regenerate_quest",
    "reset_all_progress",
    "reset_item",
    "set_item",
    "none",
  ];
  const action = types.includes(data.action) ? data.action : "none";
  const message = String(data.message ?? "").slice(0, 240);

  // Item-scoped commands require a valid, in-quest exercise id.
  if (action === "reset_item" || action === "set_item") {
    const exerciseId = typeof data.exerciseId === "string" ? data.exerciseId : "";
    if (!validItemIds.has(exerciseId)) return { action: "none", exerciseId: null, value: null, message };
    const value =
      action === "set_item" && Number.isFinite(Number(data.value))
        ? Math.max(0, Math.round(Number(data.value)))
        : null;
    if (action === "set_item" && value === null) {
      return { action: "none", exerciseId: null, value: null, message };
    }
    return { action, exerciseId, value, message };
  }

  return { action, exerciseId: null, value: null, message };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

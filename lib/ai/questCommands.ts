import type { ArchitectAction } from "@/lib/ai/schemas";

// ============================================================================
// Deterministic, client-side parser for quest-mutating commands. Runs BEFORE
// (and instead of) the LLM whenever it can confidently map a request, so a
// command like "reset my pushups" always resolves to the real objective id —
// it never depends on the model echoing the exact internal id, and can never
// "claim" a change that didn't happen.
// ============================================================================

export interface QuestItemLite {
  exerciseId: string;
  name: string;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const singular = (s: string) => s.replace(/s$/, "");

/** Finds the quest objective referenced in free text (by name or id, fuzzy). */
function matchItem(text: string, items: QuestItemLite[]): QuestItemLite | null {
  const t = norm(text);
  for (const it of items) {
    const candidates = [norm(it.name), norm(it.exerciseId)];
    for (const base of candidates) {
      for (const c of [base, singular(base)]) {
        if (c.length >= 3 && t.includes(c)) return it;
      }
    }
  }
  return null;
}

const test = (lower: string, re: RegExp) => re.test(lower);

/**
 * Returns a ready-to-confirm action, or null if the text isn't a confident
 * quest command (caller may then fall back to the LLM interpreter).
 */
export function parseQuestCommand(text: string, items: QuestItemLite[]): ArchitectAction | null {
  const lower = text.toLowerCase();

  // Regenerate / new quest.
  if (
    (test(lower, /\b(new|fresh|another|different)\b/) && test(lower, /\bquests?\b/)) ||
    test(lower, /\b(regenerate|reroll|re-?roll)\b/)
  ) {
    return {
      action: "regenerate_quest",
      exerciseId: null,
      value: null,
      message: "I will manifest a fresh Daily Quest. Confirm to proceed.",
    };
  }

  // Set a single objective to a value: "set squats to 50", "mark push-ups as 20".
  if (test(lower, /\b(set|mark|make)\b/) || /\bto\s+\d/.test(lower)) {
    const item = matchItem(lower, items);
    const numMatch = lower.match(/(?:to|=|as)\s+(\d+(?:\.\d+)?)/) ?? lower.match(/(\d+(?:\.\d+)?)/);
    if (item && numMatch) {
      const value = Math.round(parseFloat(numMatch[1]));
      return {
        action: "set_item",
        exerciseId: item.exerciseId,
        value,
        message: `I will set ${item.name} to ${value}. Confirm to proceed.`,
      };
    }
  }

  // Reset.
  if (test(lower, /\b(reset|clear|wipe|zero|redo)\b/) || test(lower, /\bstart over\b/)) {
    const item = matchItem(lower, items);
    const wantsAll = test(lower, /\b(all|everything|every|whole|entire)\b/);
    if (item && !wantsAll) {
      return {
        action: "reset_item",
        exerciseId: item.exerciseId,
        value: null,
        message: `I will reset ${item.name} to zero. Confirm to proceed.`,
      };
    }
    if (wantsAll || test(lower, /\bquests?\b/) || test(lower, /\bprogress\b/)) {
      return {
        action: "reset_all_progress",
        exerciseId: null,
        value: null,
        message: "I will reset every objective on today's quest to zero. Confirm to proceed.",
      };
    }
  }

  return null;
}

"use client";

import type { AISettings, Exercise, InstantDungeon } from "@/lib/types";
import type { PlayerSnapshot } from "@/lib/ai/snapshot";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";
import {
  type ArchitectAction,
  type ArchitectActionJSON,
  type ProposedDungeonJSON,
  type ProposedQuestJSON,
  actionSchemaInstruction,
  dungeonSchemaInstruction,
  questSchemaInstruction,
  safeParseJSON,
  validateArchitectAction,
  validateProposedDungeon,
  validateProposedQuest,
} from "@/lib/ai/schemas";
import type { ChatMessage } from "@/lib/ai/groqClient";

const ENDPOINT = "/api/coach";

async function postJSON<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function testConnection(apiKey: string): Promise<number> {
  const data = await postJSON<{ count: number }>({ action: "test", apiKey });
  return data.count;
}

export async function fetchModels(apiKey: string): Promise<string[]> {
  const data = await postJSON<{ models: string[] }>({ action: "models", apiKey });
  return data.models;
}

/** Streams assistant text; calls onToken with each chunk. Returns full text. */
export async function streamChat(
  messages: ChatMessage[],
  snapshot: PlayerSnapshot,
  ai: AISettings,
  onToken: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      action: "chat",
      apiKey: ai.groqApiKey,
      model: ai.model,
      system: buildSystemPrompt(snapshot),
      messages,
    }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onToken(chunk);
  }
  return full;
}

async function generateJSON(prompt: string, snapshot: PlayerSnapshot, ai: AISettings): Promise<string> {
  const data = await postJSON<{ content: string }>({
    action: "generate",
    apiKey: ai.groqApiKey,
    model: ai.model,
    system: buildSystemPrompt(snapshot),
    prompt,
    json: true,
  });
  return data.content;
}

export async function generateDungeon(
  snapshot: PlayerSnapshot,
  exercises: Exercise[],
  ai: AISettings,
): Promise<InstantDungeon> {
  const ids = exercises.map((e) => e.id);
  const prompt = `Generate a single themed Instant Dungeon challenge tuned to this Hunter's level, age, recovery, and weak points.\n${dungeonSchemaInstruction(ids)}`;
  const raw = await generateJSON(prompt, snapshot, ai);
  const parsed = safeParseJSON<ProposedDungeonJSON>(raw);
  const dungeon = validateProposedDungeon(parsed, new Set(ids));
  if (!dungeon) throw new Error("The Architect returned an invalid dungeon. Try again.");
  return dungeon;
}

/**
 * Interprets a free-text Hunter message as a (possibly empty) quest-mutating
 * command. Returns a validated action; `action: "none"` means the caller should
 * fall back to a normal chat reply. Never throws on a bad model response — it
 * degrades to "none" so the chat path can take over.
 */
export async function interpretCommand(
  message: string,
  snapshot: PlayerSnapshot,
  ai: AISettings,
  questItems: { exerciseId: string; name: string; target: number; completed: number }[],
): Promise<ArchitectAction> {
  const none: ArchitectAction = { action: "none", exerciseId: null, value: null, message: "" };
  try {
    const prompt = `Hunter's message: "${message}"\n\n${actionSchemaInstruction(questItems)}`;
    const raw = await generateJSON(prompt, snapshot, ai);
    const parsed = safeParseJSON<ArchitectActionJSON>(raw);
    const validIds = new Set(questItems.map((q) => q.exerciseId));
    return validateArchitectAction(parsed, validIds) ?? none;
  } catch {
    return none;
  }
}

export async function proposeQuest(
  snapshot: PlayerSnapshot,
  exercises: Exercise[],
  ai: AISettings,
): Promise<{ items: { exerciseId: string; target: number }[]; rewardExp: number; rationale: string }> {
  const ids = exercises.map((e) => e.id);
  const prompt = `Propose tomorrow's Daily Quest tuned to this Hunter's age, recovery, weak points, and goals.\n${questSchemaInstruction(ids)}`;
  const raw = await generateJSON(prompt, snapshot, ai);
  const parsed = safeParseJSON<ProposedQuestJSON>(raw);
  const quest = validateProposedQuest(parsed, new Set(ids));
  if (!quest) throw new Error("The Architect returned an invalid quest. Try again.");
  return quest;
}

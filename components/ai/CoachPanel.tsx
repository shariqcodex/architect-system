"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Send, Bot, User, Loader2, Activity, Wand2, RefreshCw } from "lucide-react";
import type { ChatMessage } from "@/lib/ai/groqClient";
import { usePlayer } from "@/lib/store/usePlayer";
import { buildExerciseMap } from "@/lib/data/exercises";
import { buildPlayerSnapshot } from "@/lib/ai/snapshot";
import { interpretCommand, proposeQuest, streamChat } from "@/lib/ai/client";
import type { ArchitectAction } from "@/lib/ai/schemas";
import { parseQuestCommand } from "@/lib/ai/questCommands";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { QuestProposalCard, type QuestProposal } from "@/components/ai/QuestProposalCard";
import { ActionConfirmCard } from "@/components/ai/ActionConfirmCard";

const WELCOME =
  "I am the Architect. I can see your full status — ranks, fatigue, streak, and goals. Ask me how to break a plateau, fix an imbalance, or train around an injury. I can also reconfigure your Daily Quest — try “give me new quests” or “reset my squats” (you'll confirm before anything changes).";

// Cheap client-side gate: only spend an interpret call when the message looks
// like it might be asking to change quest state. Pure questions skip straight
// to a normal (streaming) chat reply.
const COMMAND_HINT =
  /\b(reset|regenerate|reroll|re-?roll|wipe|clear|new quest|new quests|change (my )?quest|fresh quest|set (my )?\w+ to|mark|redo|start over)\b/i;

export function CoachPanel() {
  const state = usePlayer();
  const ai = state.ai;
  const aiReady = ai.enabled && !!ai.groqApiKey;

  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [proposal, setProposal] = useState<QuestProposal | null>(null);
  const [pendingAction, setPendingAction] = useState<ArchitectAction | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = () => requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 1e9 }));

  type Msg = { role: "user" | "assistant"; content: string };

  /** Streams a normal conversational reply for the given history. */
  const runChat = async (history: Msg[]) => {
    const withPlaceholder: Msg[] = [...history, { role: "assistant", content: "" }];
    setMessages(withPlaceholder);
    setBusy(true);
    scroll();
    const apiMessages: ChatMessage[] = history
      .filter((m) => m.content)
      .map((m) => ({ role: m.role, content: m.content }));
    try {
      const snapshot = buildPlayerSnapshot(state);
      await streamChat(apiMessages, snapshot, ai, (chunk) => {
        setMessages((cur) => {
          const next = [...cur];
          next[next.length - 1] = {
            role: "assistant",
            content: (next[next.length - 1]?.content ?? "") + chunk,
          };
          return next;
        });
        scroll();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
      setMessages((cur) => cur.slice(0, -1)); // drop empty assistant bubble
    } finally {
      setBusy(false);
    }
  };

  /** Shows a confirmable directive (no state changes until the user confirms). */
  const showAction = (action: ArchitectAction, history: Msg[]) => {
    setMessages([
      ...history,
      { role: "assistant", content: action.message || "Confirm the directive below, Hunter." },
    ]);
    setPendingAction(action);
    setBusy(false);
    scroll();
  };

  const send = async (text: string) => {
    if (!text.trim() || busy || !aiReady) return;
    setError("");
    setInput("");
    setPendingAction(null);
    const history: Msg[] = [...messages, { role: "user", content: text }];

    const exMap = buildExerciseMap(state.exercises);
    const items = (state.quest?.items ?? []).map((it) => ({
      exerciseId: it.exerciseId,
      name: exMap[it.exerciseId]?.name ?? it.exerciseId,
      target: it.target,
      completed: it.completed,
    }));
    const isQuestion = /\?\s*$/.test(text.trim());

    // 1) Deterministic parse first — instant, reliable, no model round-trip.
    if (!isQuestion) {
      const local = parseQuestCommand(text, items);
      if (local) {
        showAction(local, history);
        return;
      }
    }

    // 2) Questions, or anything that doesn't smell like a command → chat reply.
    if (isQuestion || !COMMAND_HINT.test(text)) {
      await runChat(history);
      return;
    }

    // 3) Command-like but the parser couldn't map it → ask the model, then
    //    either show the action or CLARIFY. Never fall through to a free reply
    //    that could falsely claim a change was made.
    setMessages(history);
    setBusy(true);
    scroll();
    try {
      const snapshot = buildPlayerSnapshot(state);
      const action = await interpretCommand(text, snapshot, ai, items);
      if (action.action !== "none") {
        showAction(action, history);
        return;
      }
      const names = items.map((it) => it.name).join(", ");
      setMessages([
        ...history,
        {
          role: "assistant",
          content: items.length
            ? `I couldn't tell which objective you meant. Today's quest has: ${names}. Try "reset my ${items[0].name}", "set ${items[0].name} to 10", or "give me a new quest".`
            : "There's no active quest to modify right now.",
        },
      ]);
      setBusy(false);
      scroll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
      setBusy(false);
    }
  };

  const handleProposeQuest = async () => {
    if (busy || !aiReady) return;
    setBusy(true);
    setError("");
    try {
      const snapshot = buildPlayerSnapshot(state);
      const q = await proposeQuest(snapshot, state.exercises, ai);
      setProposal(q);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!aiReady) {
    return (
      <Panel corners title="[ The Architect ]">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Bot size={32} className="text-accent" />
          <p className="max-w-sm font-mono text-xs leading-relaxed text-text-mid">
            The Architect is offline. Link a Groq API key to awaken your AI coach — it reads your live
            stats and tailors guidance to your age, recovery, and goals.
          </p>
          <Link href="/settings">
            <Button>Link the Architect</Button>
          </Link>
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      corners
      title="[ The Architect ]"
      className="flex h-[640px] max-h-[78vh] flex-col"
      contentClassName="flex min-h-0 flex-1 flex-col"
    >
      <div className="mb-2 flex flex-wrap gap-1.5">
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => send("Analyze my muscle balance and tell me exactly what to prioritize next, with a weekly plan.")}>
          <Activity size={13} /> Weak-point analysis
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={handleProposeQuest}>
          <Wand2 size={13} /> Propose tomorrow&apos;s quest
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => send("Give me a brand new Daily Quest.")}
        >
          <RefreshCw size={13} /> New Daily Quest
        </Button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${
                m.role === "user" ? "border-border bg-bg-600 text-text-mid" : "border-accent/40 bg-accent/10 text-accent"
              }`}
            >
              {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-panel px-3 py-2 font-mono text-[13px] leading-relaxed ${
                m.role === "user" ? "bg-accent/12 text-text-hi" : "border border-border bg-bg-800/70 text-text-hi"
              }`}
            >
              {m.content || (busy && i === messages.length - 1 ? <Loader2 size={14} className="animate-spin" /> : "")}
            </div>
          </div>
        ))}
        {proposal && (
          <QuestProposalCard proposal={proposal} onDismiss={() => setProposal(null)} />
        )}
        {pendingAction && (
          <ActionConfirmCard
            action={pendingAction}
            onResolve={(confirmed) => {
              setPendingAction(null);
              setMessages((cur) => [
                ...cur,
                {
                  role: "assistant",
                  content: confirmed
                    ? "Done. The System has been updated."
                    : "Understood — nothing was changed.",
                },
              ]);
              scroll();
            }}
          />
        )}
      </div>

      {error && <p className="mt-2 font-mono text-[11px] text-danger">{error}</p>}

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send(input))}
          placeholder="Ask the Architect…"
          disabled={busy}
          className="h-10 flex-1 rounded-inset border border-border bg-bg-900 px-3 font-mono text-sm text-text-hi outline-none focus:border-border-hi disabled:opacity-60"
        />
        <Button onClick={() => send(input)} disabled={busy || !input.trim()} className="h-10 w-10 !px-0">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </Button>
      </div>
      <p className="mt-1.5 font-mono text-[10px] text-text-low">
        General fitness guidance, not medical advice. Consult a professional for pain or conditions.
      </p>
    </Panel>
  );
}

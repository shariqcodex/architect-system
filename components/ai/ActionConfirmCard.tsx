"use client";

import { Check, X, ShieldAlert } from "lucide-react";
import { usePlayer } from "@/lib/store/usePlayer";
import { buildExerciseMap } from "@/lib/data/exercises";
import type { ArchitectAction } from "@/lib/ai/schemas";
import { Button } from "@/components/ui/Button";

/** Human-readable description of what a confirmed action will do. */
function describe(action: ArchitectAction, exName: (id: string) => string): {
  title: string;
  detail: string;
} {
  switch (action.action) {
    case "regenerate_quest":
      return {
        title: "Reconfigure Daily Quest",
        detail:
          "Replace today's quest with a brand-new set of objectives. All current progress on it will be cleared.",
      };
    case "reset_all_progress":
      return {
        title: "Reset all progress",
        detail: "Set every objective on today's Daily Quest back to 0. The objectives stay the same.",
      };
    case "reset_item":
      return {
        title: `Reset ${exName(action.exerciseId ?? "")}`,
        detail: `Set ${exName(action.exerciseId ?? "")} progress back to 0 on today's Daily Quest.`,
      };
    case "set_item":
      return {
        title: `Set ${exName(action.exerciseId ?? "")}`,
        detail: `Set ${exName(action.exerciseId ?? "")} progress to ${action.value} on today's Daily Quest.`,
      };
    default:
      return { title: "No change", detail: "" };
  }
}

export function ActionConfirmCard({
  action,
  onResolve,
}: {
  action: ArchitectAction;
  /** Called after the user confirms or cancels, so the host can clear the card. */
  onResolve: (confirmed: boolean) => void;
}) {
  const exercises = usePlayer((s) => s.exercises);
  const regenerate = usePlayer((s) => s.regenerateDailyQuest);
  const resetAll = usePlayer((s) => s.resetQuestProgress);
  const resetItem = usePlayer((s) => s.resetQuestItem);
  const setItem = usePlayer((s) => s.setQuestItemProgress);
  const exMap = buildExerciseMap(exercises);
  const exName = (id: string) => exMap[id]?.name ?? id;

  const { title, detail } = describe(action, exName);

  const confirm = () => {
    switch (action.action) {
      case "regenerate_quest":
        regenerate();
        break;
      case "reset_all_progress":
        resetAll();
        break;
      case "reset_item":
        if (action.exerciseId) resetItem(action.exerciseId);
        break;
      case "set_item":
        if (action.exerciseId && action.value != null) setItem(action.exerciseId, action.value);
        break;
    }
    onResolve(true);
  };

  return (
    <div
      className="rounded-panel border border-purple/45 bg-purple/8 p-4 shadow-glow-purple"
      role="alertdialog"
      aria-label="Confirm System directive"
    >
      <div className="mb-2 flex items-center gap-2 font-display text-xs font-bold uppercase tracking-[0.22em] text-purple-hi">
        <ShieldAlert size={14} />
        [ System Directive ]
      </div>
      <p className="font-display text-sm font-semibold text-text-hi">{title}</p>
      <p className="mt-1 font-mono text-[11px] leading-relaxed text-text-mid">{detail}</p>
      {action.message && (
        <p className="mt-2 border-l-2 border-purple/40 pl-2.5 font-mono text-[11px] italic leading-relaxed text-purple-hi">
          {action.message}
        </p>
      )}
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => onResolve(false)}>
          <X size={14} /> Cancel
        </Button>
        <Button size="sm" variant="primary" onClick={confirm}>
          <Check size={14} /> Confirm
        </Button>
      </div>
    </div>
  );
}

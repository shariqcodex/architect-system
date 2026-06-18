"use client";

import { Check, X } from "lucide-react";
import { usePlayer } from "@/lib/store/usePlayer";
import { buildExerciseMap } from "@/lib/data/exercises";
import { Button } from "@/components/ui/Button";

export interface QuestProposal {
  items: { exerciseId: string; target: number }[];
  rewardExp: number;
  rationale: string;
}

export function QuestProposalCard({
  proposal,
  onDismiss,
}: {
  proposal: QuestProposal;
  onDismiss: () => void;
}) {
  const exercises = usePlayer((s) => s.exercises);
  const accept = usePlayer((s) => s.acceptProposedQuest);
  const exMap = buildExerciseMap(exercises);

  return (
    <div className="rounded-panel border border-accent/40 bg-accent/5 p-4 shadow-glow">
      <div className="mb-2 font-display text-xs font-bold uppercase tracking-[0.22em] text-accent">
        [ Proposed Quest ]
      </div>
      {proposal.rationale && (
        <p className="mb-3 font-mono text-[11px] leading-relaxed text-text-mid">{proposal.rationale}</p>
      )}
      <div className="flex flex-col gap-1.5">
        {proposal.items.map((it) => {
          const ex = exMap[it.exerciseId];
          return (
            <div
              key={it.exerciseId}
              className="flex items-center justify-between rounded-inset border border-border bg-bg-900/50 px-3 py-1.5 font-mono text-xs"
            >
              <span className="text-text-hi">{ex?.name ?? it.exerciseId}</span>
              <span className="text-text-mid">
                {it.target} {ex?.unit === "reps" ? "" : ex?.unit}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[11px] text-accent">Reward +{proposal.rewardExp} EXP</span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            <X size={14} /> Dismiss
          </Button>
          <Button
            size="sm"
            variant="success"
            onClick={() => {
              accept(proposal.items, proposal.rewardExp);
              onDismiss();
            }}
          >
            <Check size={14} /> Accept
          </Button>
        </div>
      </div>
    </div>
  );
}

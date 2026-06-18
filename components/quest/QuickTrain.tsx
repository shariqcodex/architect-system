"use client";

import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { usePlayer } from "@/lib/store/usePlayer";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";

export function QuickTrain() {
  const exercises = usePlayer((s) => s.exercises);
  const log = usePlayer((s) => s.logExercise);
  const [exId, setExId] = useState<string>(exercises[0]?.id ?? "");
  const [amount, setAmount] = useState<string>("");

  const ex = exercises.find((e) => e.id === exId);

  const submit = () => {
    const v = parseFloat(amount);
    if (!ex || Number.isNaN(v) || v <= 0) return;
    log(ex.id, v, "manual");
    setAmount("");
  };

  return (
    <Panel corners title="[ Quick Train ]">
      <p className="mb-3 font-mono text-[11px] text-text-low">
        Log any training outside the Daily Quest. EXP flows to the muscles it works.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={exId}
          onChange={(e) => setExId(e.target.value)}
          className="h-10 flex-1 rounded-inset border border-border bg-bg-900 px-3 font-mono text-sm text-text-hi outline-none focus:border-border-hi"
        >
          {exercises.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} ({e.unit})
            </option>
          ))}
        </select>
        <input
          type="number"
          inputMode="decimal"
          placeholder={ex ? ex.unit : "amount"}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="h-10 w-full rounded-inset border border-border bg-bg-900 px-3 text-right font-mono text-sm text-text-hi outline-none focus:border-border-hi sm:w-28"
        />
        <Button onClick={submit} className="h-10">
          <Dumbbell size={15} /> Log
        </Button>
      </div>
    </Panel>
  );
}

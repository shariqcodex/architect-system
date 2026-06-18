"use client";

import { CoachPanel } from "@/components/ai/CoachPanel";

export default function CoachPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-text-hi">The Architect</h1>
        <p className="font-mono text-[11px] text-text-low">
          Your data-aware, age-aware AI coach — powered by Groq.
        </p>
      </div>
      <CoachPanel />
    </div>
  );
}

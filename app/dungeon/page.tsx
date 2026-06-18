"use client";

import { useMemo, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import type { InstantDungeon } from "@/lib/types";
import { usePlayer } from "@/lib/store/usePlayer";
import { presetDungeons } from "@/lib/data/dungeons";
import { generateDungeon } from "@/lib/ai/client";
import { buildPlayerSnapshot } from "@/lib/ai/snapshot";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { DungeonCard } from "@/components/dungeon/DungeonCard";
import { DungeonRunner } from "@/components/dungeon/DungeonRunner";
import { BossPanel } from "@/components/boss/BossPanel";
import { Shop } from "@/components/shop/Shop";

export default function DungeonPage() {
  const state = usePlayer();
  const presets = useMemo(
    () => presetDungeons(state.player.level, state.profile),
    [state.player.level, state.profile],
  );
  const [active, setActive] = useState<InstantDungeon | null>(null);
  const [generated, setGenerated] = useState<InstantDungeon[]>([]);
  const [genState, setGenState] = useState<"idle" | "loading" | "error">("idle");
  const [genError, setGenError] = useState("");

  const aiReady = state.ai.enabled && !!state.ai.groqApiKey;

  const handleGenerate = async () => {
    setGenState("loading");
    setGenError("");
    try {
      const snapshot = buildPlayerSnapshot(state);
      const d = await generateDungeon(snapshot, state.exercises, state.ai);
      setGenerated((g) => [d, ...g]);
      setGenState("idle");
    } catch (e) {
      setGenState("error");
      setGenError(e instanceof Error ? e.message : "Generation failed.");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-text-hi">Instant Dungeons</h1>
        <Button onClick={handleGenerate} disabled={!aiReady || genState === "loading"} title={aiReady ? "" : "Link the Architect in Settings"}>
          {genState === "loading" ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          Generate via Architect
        </Button>
      </div>

      {!aiReady && (
        <p className="font-mono text-[11px] text-text-low">
          Link the Architect in Settings to generate custom, age-appropriate dungeons. Preset gates are always available.
        </p>
      )}
      {genState === "error" && <p className="font-mono text-[11px] text-danger">{genError}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {generated.map((d) => (
          <DungeonCard key={d.id} dungeon={d} onEnter={() => setActive(d)} />
        ))}
        {presets.map((d) => (
          <DungeonCard key={d.id} dungeon={d} onEnter={() => setActive(d)} />
        ))}
      </div>

      <BossPanel />
      <Shop />

      {active && <DungeonRunner dungeon={active} onClose={() => setActive(null)} />}
    </div>
  );
}

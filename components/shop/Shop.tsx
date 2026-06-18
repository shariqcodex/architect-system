"use client";

import { Snowflake, Palette, Coins } from "lucide-react";
import { usePlayer } from "@/lib/store/usePlayer";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";

const ACCENTS = [
  { name: "System Blue", value: "#3DA9FC" },
  { name: "Monarch Violet", value: "#A855F7" },
  { name: "Crimson S", value: "#FF4D6D" },
  { name: "Gold A", value: "#F5C04A" },
];

export function Shop() {
  const gold = usePlayer((s) => s.player.gold);
  const restTokens = usePlayer((s) => s.restTokens);
  const accentColor = usePlayer((s) => s.accentColor);
  const buy = usePlayer((s) => s.buyItem);

  return (
    <Panel
      corners
      title="[ Shop ]"
      action={
        <span className="flex items-center gap-1 font-mono text-xs text-warning">
          <Coins size={13} /> {gold}
        </span>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-inset border border-border bg-bg-800/50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Snowflake size={16} className="text-accent-2" />
              <div>
                <div className="font-display text-sm font-semibold text-text-hi">Rest Token</div>
                <div className="font-mono text-[10px] text-text-low">
                  Auto-absorbs one penalty to protect your streak. Owned: {restTokens}
                </div>
              </div>
            </div>
            <Button size="sm" onClick={() => buy(120, "rest-token")} disabled={gold < 120}>
              120
            </Button>
          </div>
        </div>

        <div className="rounded-inset border border-border bg-bg-800/50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Palette size={16} className="text-accent" />
            <div className="font-display text-sm font-semibold text-text-hi">HUD Accent</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.value}
                onClick={() => buy(80, "accent", a.value)}
                disabled={gold < 80}
                className="flex items-center justify-between rounded-inset border border-border bg-bg-900/60 px-2.5 py-2 font-mono text-[11px] text-text-mid hover:border-border-hi disabled:opacity-40"
                style={accentColor === a.value ? { borderColor: a.value, color: a.value } : undefined}
              >
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ background: a.value }} />
                  {a.name}
                </span>
                <span>80</span>
              </button>
            ))}
          </div>
          <p className="mt-2 font-mono text-[10px] text-text-low">
            Cosmetic accents are purely in-app currency — no real money, ever.
          </p>
        </div>
      </div>
    </Panel>
  );
}

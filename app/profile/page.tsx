"use client";

import { Check, Award, Lock } from "lucide-react";
import { usePlayer } from "@/lib/store/usePlayer";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { StatPanel } from "@/components/hud/StatPanel";
import { RankBadge } from "@/components/ui/RankBadge";
import { cn } from "@/lib/utils/cn";

export default function ProfilePage() {
  const player = usePlayer((s) => s.player);
  const allocate = usePlayer((s) => s.allocateStat);
  const setActiveTitle = usePlayer((s) => s.setActiveTitle);
  const achievements = usePlayer((s) => s.achievements);
  const profile = usePlayer((s) => s.profile);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-text-hi">Hunter Profile</h1>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="flex flex-col gap-5">
          <Panel corners title="[ Identity ]">
            <div className="flex items-center gap-4">
              <RankBadge rank={player.hunterRank} size="lg" />
              <div>
                <div className="font-display text-xl font-bold text-text-hi">{player.name}</div>
                <div className="font-mono text-xs text-text-mid">
                  Level {player.level} · Rank {player.hunterRank}
                </div>
                {player.activeTitle && (
                  <div className="mt-1 font-mono text-[11px] text-accent">“{player.activeTitle}”</div>
                )}
              </div>
            </div>
            {profile && (
              <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-[11px] text-text-mid">
                <Field label="Age" value={`${profile.age}`} />
                <Field label="Experience" value={profile.experience} />
                {profile.heightCm ? <Field label="Height" value={`${profile.heightCm} cm`} /> : null}
                {profile.weightKg ? <Field label="Weight" value={`${profile.weightKg} kg`} /> : null}
                <Field label="Longest streak" value={`${player.longestStreak} days`} />
                <Field label="Sex" value={profile.sex.replace(/_/g, " ")} />
              </div>
            )}
          </Panel>

          <Panel
            corners
            title="[ Attributes ]"
            action={
              <span className="font-mono text-[11px] text-warning">
                {player.statPoints} pts
              </span>
            }
          >
            <StatPanel stats={player.stats} statPoints={player.statPoints} onAllocate={allocate} />
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <Panel corners title="[ Titles ]">
            {player.titles.length === 0 ? (
              <p className="font-mono text-xs text-text-low">No titles earned yet. Unlock them via achievements and bosses.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setActiveTitle(null)}
                  className={cn(
                    "flex items-center justify-between rounded-inset border px-3 py-2 text-left font-mono text-xs",
                    player.activeTitle === null ? "border-accent/50 bg-accent/10 text-accent" : "border-border text-text-mid",
                  )}
                >
                  None
                  {player.activeTitle === null && <Check size={14} />}
                </button>
                {player.titles.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTitle(t)}
                    className={cn(
                      "flex items-center justify-between rounded-inset border px-3 py-2 text-left font-mono text-xs",
                      player.activeTitle === t ? "border-accent/50 bg-accent/10 text-accent" : "border-border text-text-mid hover:border-border-hi",
                    )}
                  >
                    {t}
                    {player.activeTitle === t && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </Panel>

          <Panel corners title="[ Achievements ]">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className={cn(
                    "flex items-start gap-2.5 rounded-inset border px-3 py-2.5",
                    a.unlocked ? "border-success/30 bg-success/5" : "border-border bg-bg-800/40 opacity-70",
                  )}
                >
                  <span className={a.unlocked ? "text-success" : "text-text-low"}>
                    {a.unlocked ? <Award size={16} /> : <Lock size={16} />}
                  </span>
                  <div>
                    <div className={cn("font-display text-sm font-semibold", a.unlocked ? "text-text-hi" : "text-text-mid")}>
                      {a.title}
                    </div>
                    <div className="font-mono text-[10px] text-text-low">{a.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-inset border border-border bg-bg-800/50 px-2.5 py-1.5">
      <div className="text-[9px] uppercase tracking-widest text-text-low">{label}</div>
      <div className="text-text-hi">{value}</div>
    </div>
  );
}

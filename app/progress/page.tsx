"use client";

import { usePlayer } from "@/lib/store/usePlayer";
import { Panel } from "@/components/ui/Panel";
import { StatRadar } from "@/components/charts/StatRadar";
import { MuscleRanks } from "@/components/charts/MuscleRanks";
import { WeeklyVolume } from "@/components/charts/WeeklyVolume";
import { StreakHeatmap } from "@/components/charts/StreakHeatmap";

export default function ProgressPage() {
  const player = usePlayer((s) => s.player);
  const muscles = usePlayer((s) => s.muscles);
  const logs = usePlayer((s) => s.logs);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-text-hi">Progress</h1>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel corners title="[ Attribute Radar ]">
          <StatRadar stats={player.stats} />
        </Panel>
        <Panel corners title="[ Daily EXP — last 14 days ]">
          <WeeklyVolume logs={logs} />
        </Panel>
      </div>

      <Panel corners title="[ Activity — last 12 weeks ]">
        <StreakHeatmap logs={logs} />
        <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-text-low">
          <span>Less</span>
          <span>
            Current streak {player.streak}d · longest {player.longestStreak}d
          </span>
          <span>More</span>
        </div>
      </Panel>

      <Panel corners title="[ Muscle Ranks ]">
        <MuscleRanks muscles={muscles} />
      </Panel>
    </div>
  );
}

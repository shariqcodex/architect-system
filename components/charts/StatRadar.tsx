"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { PlayerStats } from "@/lib/types";
import { colors } from "@/lib/design/tokens";

export function StatRadar({ stats }: { stats: PlayerStats }) {
  const data = (Object.keys(stats) as (keyof PlayerStats)[]).map((k) => ({
    stat: k,
    value: stats[k],
  }));
  // Fixed radial scale so equal base stats (e.g. all 10 at the start) render as
  // a small shape instead of auto-scaling to fill the whole chart. Grows if any
  // stat climbs past the baseline cap.
  const maxStat = Math.max(...data.map((d) => d.value), 0);
  const axisMax = Math.max(50, Math.ceil(maxStat / 10) * 10 + 10);
  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="rgba(120,160,220,0.18)" />
        <PolarAngleAxis
          dataKey="stat"
          tick={{ fill: colors.textMid, fontSize: 11, fontFamily: "var(--font-display)" }}
        />
        <PolarRadiusAxis domain={[0, axisMax]} tick={false} axisLine={false} tickCount={5} />
        <Radar
          dataKey="value"
          stroke={colors.accent}
          fill={colors.accent}
          fillOpacity={0.35}
          isAnimationActive
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

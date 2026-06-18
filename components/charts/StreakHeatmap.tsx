"use client";

import { useMemo } from "react";
import type { LogEntry } from "@/lib/types";
import { lastNDays, localDateKey } from "@/lib/engine/dates";

// 12-week (84-day) activity heatmap based on EXP earned per day.
export function StreakHeatmap({ logs }: { logs: LogEntry[] }) {
  const cells = useMemo(() => {
    const days = lastNDays(84);
    const totals: Record<string, number> = {};
    for (const d of days) totals[d] = 0;
    for (const l of logs) {
      const k = localDateKey(new Date(l.date));
      if (k in totals) totals[k] = (totals[k] ?? 0) + l.expGained;
    }
    const max = Math.max(1, ...Object.values(totals));
    return days.map((d) => ({ date: d, value: totals[d] ?? 0, intensity: (totals[d] ?? 0) / max }));
  }, [logs]);

  const color = (intensity: number) => {
    if (intensity <= 0) return "rgba(120,160,220,0.06)";
    const a = 0.2 + intensity * 0.8;
    return `rgba(61,169,252,${a.toFixed(2)})`;
  };

  return (
    <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ gridAutoColumns: "minmax(0,1fr)" }}>
      {cells.map((c) => (
        <div
          key={c.date}
          title={`${c.date}: ${Math.round(c.value)} EXP`}
          className="aspect-square rounded-[3px] border border-border/40"
          style={{ background: color(c.intensity) }}
        />
      ))}
    </div>
  );
}

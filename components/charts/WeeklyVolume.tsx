"use client";

import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import type { LogEntry } from "@/lib/types";
import { lastNDays, localDateKey } from "@/lib/engine/dates";
import { colors } from "@/lib/design/tokens";

export function WeeklyVolume({ logs }: { logs: LogEntry[] }) {
  const data = useMemo(() => {
    const days = lastNDays(14);
    const totals: Record<string, number> = {};
    for (const d of days) totals[d] = 0;
    for (const l of logs) {
      const k = localDateKey(new Date(l.date));
      if (k in totals) totals[k] = (totals[k] ?? 0) + l.expGained;
    }
    return days.map((d) => ({
      day: d.slice(5),
      exp: Math.round(totals[d] ?? 0),
    }));
  }, [logs]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="rgba(120,160,220,0.1)" vertical={false} />
        <XAxis dataKey="day" tick={{ fill: colors.textLow, fontSize: 9 }} tickLine={false} axisLine={false} interval={1} />
        <YAxis tick={{ fill: colors.textLow, fontSize: 9 }} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          cursor={{ fill: "rgba(61,169,252,0.08)" }}
          contentStyle={{
            background: colors.bg800,
            border: `1px solid ${colors.borderHi}`,
            borderRadius: 8,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: colors.textHi,
          }}
        />
        <Bar dataKey="exp" fill={colors.accent} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

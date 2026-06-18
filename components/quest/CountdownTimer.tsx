"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { formatCountdown, msUntilMidnight } from "@/lib/engine/dates";
import { usePlayer } from "@/lib/store/usePlayer";

export function CountdownTimer() {
  const [ms, setMs] = useState<number>(() => msUntilMidnight());
  const ensureDailyQuest = usePlayer((s) => s.ensureDailyQuest);

  useEffect(() => {
    const tick = () => {
      const remaining = msUntilMidnight();
      setMs(remaining);
      if (remaining <= 1000) {
        // crossed midnight → roll over quest / evaluate penalty
        setTimeout(() => ensureDailyQuest(), 1200);
      }
    };
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [ensureDailyQuest]);

  const urgent = ms < 2 * 3600 * 1000; // under 2h

  return (
    <div className="flex items-center gap-2">
      <Clock size={14} className={urgent ? "text-danger" : "text-text-mid"} />
      <span
        className={`font-mono text-sm font-bold tabular-nums ${urgent ? "text-danger" : "text-text-hi"}`}
        title="Time until local midnight"
      >
        {formatCountdown(ms)}
      </span>
      <span className="font-display text-[10px] uppercase tracking-widest text-text-low">to reset</span>
    </div>
  );
}

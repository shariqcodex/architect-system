"use client";

import { motion } from "framer-motion";
import { Dumbbell, HeartPulse, Wind, Brain, Eye, Plus } from "lucide-react";
import type { PlayerStats, StatKey } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

const META: Record<StatKey, { label: string; icon: typeof Dumbbell; hint: string }> = {
  STR: { label: "Strength", icon: Dumbbell, hint: "Resistance volume" },
  VIT: { label: "Vitality", icon: HeartPulse, hint: "Stamina & HP" },
  AGI: { label: "Agility", icon: Wind, hint: "Speed & plyometrics" },
  INT: { label: "Intellect", icon: Brain, hint: "Consistency & Focus" },
  PER: { label: "Perception", icon: Eye, hint: "Achievements" },
};

const ORDER: StatKey[] = ["STR", "VIT", "AGI", "INT", "PER"];

export function StatPanel({
  stats,
  statPoints,
  onAllocate,
}: {
  stats: PlayerStats;
  statPoints: number;
  onAllocate?: (stat: StatKey) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {ORDER.map((key) => {
        const { label, icon: Icon, hint } = META[key];
        return (
          <div
            key={key}
            className="flex items-center gap-3 rounded-inset border border-border bg-bg-800/60 px-3 py-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border-hi/40 bg-accent/10 text-accent">
              <Icon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-xs font-semibold uppercase tracking-widest text-text-mid">
                  {key}
                </span>
                <motion.span
                  key={stats[key]}
                  initial={{ scale: 1.3, color: "#00E0FF" }}
                  animate={{ scale: 1, color: "#E6EDF7" }}
                  transition={{ duration: 0.3 }}
                  className="font-mono text-lg font-bold tabular-nums"
                >
                  {stats[key]}
                </motion.span>
              </div>
              <span className="text-[10px] text-text-low">
                {label} · {hint}
              </span>
            </div>
            {onAllocate && (
              <Button
                size="sm"
                variant={statPoints > 0 ? "primary" : "ghost"}
                disabled={statPoints <= 0}
                onClick={() => onAllocate(key)}
                className={cn("h-7 w-7 !px-0")}
                aria-label={`Allocate point to ${label}`}
              >
                <Plus size={14} />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

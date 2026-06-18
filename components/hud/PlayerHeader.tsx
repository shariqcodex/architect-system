"use client";

import { motion } from "framer-motion";
import { Flame, Coins } from "lucide-react";
import { usePlayer } from "@/lib/store/usePlayer";
import { Panel } from "@/components/ui/Panel";
import { ExpBar } from "@/components/ui/ExpBar";
import { RankBadge } from "@/components/ui/RankBadge";
import { rankColors } from "@/lib/design/tokens";

export function PlayerHeader() {
  const player = usePlayer((s) => s.player);

  const rankColor = rankColors[player.hunterRank];
  const hpRatio = player.maxHp > 0 ? Math.min(1, player.hp / player.maxHp) : 1;
  const mpRatio = player.maxMp > 0 ? Math.min(1, player.mp / player.maxMp) : 1;

  return (
    <Panel corners className="overflow-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        {/* Rank Badge */}
        <div className="flex flex-shrink-0 items-center gap-4 sm:flex-col sm:items-center sm:gap-1">
          <RankBadge rank={player.hunterRank} size="xl" />
          {/* Mobile: name beside badge */}
          <div className="min-w-0 sm:hidden">
            <h1
              className="truncate font-display text-xl font-bold text-text-hi"
              style={{ textShadow: `0 0 18px ${rankColor}55` }}
            >
              {player.name}
            </h1>
            {player.activeTitle && (
              <span className="mt-0.5 inline-block rounded-full border border-accent/35 bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">
                {player.activeTitle}
              </span>
            )}
          </div>
        </div>

        {/* Main info */}
        <div className="min-w-0 flex-1">
          {/* Desktop name + title */}
          <div className="mb-2 hidden items-baseline gap-3 sm:flex">
            <h1
              className="truncate font-display text-2xl font-bold text-text-hi"
              style={{ textShadow: "0 0 22px rgba(61,169,252,0.5)" }}
            >
              {player.name}
            </h1>
            {player.activeTitle && (
              <span className="rounded-full border border-accent/35 bg-accent/10 px-2.5 py-0.5 font-mono text-[10px] text-accent">
                {player.activeTitle}
              </span>
            )}
          </div>

          {/* Level + Rank */}
          <div className="mb-3 flex items-center gap-3 font-mono text-xs text-text-mid">
            <span>
              <span className="text-text-low">LV </span>
              <span className="text-sm font-bold text-text-hi">{player.level}</span>
            </span>
            <span className="text-border-hi">·</span>
            <span>
              <span className="text-text-low">RANK </span>
              <span className="font-bold" style={{ color: rankColor }}>
                {player.hunterRank}
              </span>
            </span>
          </div>

          {/* HP + MP bars */}
          <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-2">
            <VitalBar
              label="HP"
              value={player.hp}
              max={player.maxHp}
              ratio={hpRatio}
              color="#36d399"
              gradientFrom="#16a34a"
            />
            <VitalBar
              label="MP"
              value={player.mp}
              max={player.maxMp}
              ratio={mpRatio}
              color="#00e0ff"
              gradientFrom="#0284c7"
            />
          </div>

          {/* EXP */}
          <ExpBar
            value={player.exp}
            max={player.expToNext}
            color="#3DA9FC"
            gradientTo="#8B5CF6"
            label="EXP"
            rightLabel={`${Math.round(player.exp).toLocaleString()} / ${player.expToNext.toLocaleString()}`}
          />
        </div>

        {/* Streak + Gold */}
        <div className="flex gap-2 sm:flex-col">
          <StatTile
            icon={<Flame size={13} />}
            label="Streak"
            value={`${player.streak}d`}
            color="var(--warning)"
          />
          <StatTile
            icon={<Coins size={13} />}
            label="Gold"
            value={`${player.gold}`}
            color="#F5C04A"
          />
        </div>
      </div>

      {player.statPoints > 0 && (
        <div className="mt-3 rounded-inset border border-warning/40 bg-warning/10 px-3 py-1.5 font-mono text-[11px] text-warning">
          {player.statPoints} unspent stat point{player.statPoints === 1 ? "" : "s"} — visit Profile to allocate.
        </div>
      )}
    </Panel>
  );
}

function VitalBar({
  label,
  value,
  max,
  ratio,
  color,
  gradientFrom,
}: {
  label: string;
  value: number;
  max: number;
  ratio: number;
  color: string;
  gradientFrom: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between font-mono text-[10px]">
        <span className="font-semibold tracking-widest" style={{ color }}>
          {label}
        </span>
        <span className="tabular-nums text-text-low">
          {value}/{max}
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full border border-border bg-bg-900/80">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${gradientFrom}, ${color})`,
            boxShadow: `0 0 8px ${color}88`,
          }}
          initial={false}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-inset border border-border bg-bg-800/60 px-2.5 py-1.5">
      <div
        className="flex items-center gap-1 font-display text-[9px] uppercase tracking-widest"
        style={{ color }}
      >
        {icon}
        {label}
      </div>
      <div className="font-mono text-sm font-bold tabular-nums text-text-hi">{value}</div>
    </div>
  );
}

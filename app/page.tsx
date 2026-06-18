"use client";

import { Panel } from "@/components/ui/Panel";
import { PlayerHeader } from "@/components/hud/PlayerHeader";
import { BodyAvatar } from "@/components/avatar/BodyAvatar";
import { DailyQuestCard } from "@/components/quest/DailyQuestCard";
import { QuickTrain } from "@/components/quest/QuickTrain";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-5">
      <PlayerHeader />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Panel corners title="[ Body Status ]">
          <BodyAvatar />
        </Panel>

        <div className="flex flex-col gap-5">
          <DailyQuestCard />
          <QuickTrain />
        </div>
      </div>
    </div>
  );
}

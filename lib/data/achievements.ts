import type { Achievement } from "@/lib/types";

// Achievement definitions. `unlocked` is evaluated against live state in the store.
export const ACHIEVEMENT_DEFS: Omit<Achievement, "unlocked" | "unlockedAt">[] = [
  { id: "first-blood", title: "First Blood", description: "Log your first exercise." },
  { id: "first-quest", title: "Awakened", description: "Complete your first Daily Quest." },
  { id: "streak-7", title: "Disciplined", description: "Reach a 7-day streak." },
  { id: "iron-will", title: "Iron Will", description: "Reach a 30-day streak." },
  { id: "unbroken", title: "Unbroken", description: "Reach a 100-day streak." },
  { id: "level-10", title: "D-Rank Hunter", description: "Reach level 10." },
  { id: "level-35", title: "B-Rank Hunter", description: "Reach level 35." },
  { id: "level-80", title: "S-Rank Hunter", description: "Reach level 80." },
  { id: "deltoid-dominator", title: "Deltoid Dominator", description: "Raise Shoulders to rank S." },
  { id: "iron-back", title: "Iron Back", description: "Raise Back to rank A." },
  { id: "leg-day", title: "Leg Day Devotee", description: "Raise Quads to rank A." },
  { id: "balanced", title: "Perfectly Balanced", description: "Get every muscle to rank C or higher." },
  { id: "boss-slayer", title: "Boss Slayer", description: "Defeat your first Boss." },
  { id: "dungeon-diver", title: "Dungeon Diver", description: "Clear your first Instant Dungeon." },
];

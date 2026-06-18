"use client";

import { create } from "zustand";
import type {
  AISettings,
  Achievement,
  Boss,
  DailyQuest,
  Debuff,
  Exercise,
  InstantDungeon,
  LogEntry,
  MuscleGroup,
  MuscleId,
  Player,
  Settings,
  StatKey,
  UserProfile,
} from "@/lib/types";
import { MUSCLE_IDS } from "@/lib/types";
import { storage, STORE_KEY } from "@/lib/store/persistence";
import { notify } from "@/lib/store/useNotifications";
import { SEED_EXERCISES, buildExerciseMap } from "@/lib/data/exercises";
import { ACHIEVEMENT_DEFS } from "@/lib/data/achievements";
import {
  applyExp,
  expForLevel,
  hunterRankForLevel,
  maxHpForStats,
  maxMpForStats,
  removeExp,
  statPointsForLevelUp,
} from "@/lib/engine/leveling";
import {
  createInitialMuscle,
  decayedFatigue,
  rankForExp,
} from "@/lib/engine/muscles";
import { computeTraining } from "@/lib/engine/training";
import {
  DEFAULT_QUEST_TEMPLATE,
  QuestTemplate,
  generateDailyQuest,
  generatePenaltyQuest,
  isQuestComplete,
} from "@/lib/engine/quests";
import { NO_DEBUFF, PENALTY_CONFIG, buildDebuff, isDebuffExpired } from "@/lib/engine/penalty";
import { hoursBetween, localDateKey } from "@/lib/engine/dates";

// ---------------------------------------------------------------------------
// Persisted slice
// ---------------------------------------------------------------------------

interface PersistedState {
  onboarded: boolean;
  player: Player;
  profile: UserProfile | null;
  muscles: Record<MuscleId, MuscleGroup>;
  exercises: Exercise[];
  quest: DailyQuest | null;
  questTemplate: QuestTemplate;
  debuff: Debuff;
  pendingPenalty: boolean; // failure occurred → next quest is a penalty quest
  settings: Settings;
  ai: AISettings;
  achievements: Achievement[];
  bosses: Boss[];
  logs: LogEntry[];
  statXp: Partial<Record<StatKey, number>>;
  lastSeen: string; // ISO of last app open (for fatigue decay)
}

interface StoreState extends PersistedState {
  hydrated: boolean;
  lastTrainedMuscles: MuscleId[]; // for avatar animation
  // ---- lifecycle
  hydrate: () => Promise<void>;
  persist: () => void;
  resetAll: () => Promise<void>;
  // ---- onboarding
  completeOnboarding: (profile: UserProfile, name: string, startBonusExp: number) => void;
  // ---- quests
  ensureDailyQuest: () => void;
  logExercise: (exerciseId: string, amount: number, source?: LogEntry["source"]) => void;
  acceptProposedQuest: (items: { exerciseId: string; target: number }[], rewardExp: number) => void;
  setQuestTemplate: (t: QuestTemplate) => void;
  // ---- Architect-driven quest edits (confirmed by the user)
  regenerateDailyQuest: () => void;
  resetQuestProgress: () => void;
  resetQuestItem: (exerciseId: string) => void;
  setQuestItemProgress: (exerciseId: string, completed: number) => void;
  // ---- progression
  allocateStat: (stat: StatKey) => void;
  setActiveTitle: (title: string | null) => void;
  // ---- bosses / dungeons
  createBoss: (boss: Omit<Boss, "id" | "progress" | "defeated" | "createdAt" | "maxHp">) => void;
  completeDungeon: (d: InstantDungeon) => void;
  // ---- shop
  buyItem: (cost: number, effect: "rest-token" | "accent" | "theme", payload?: string) => boolean;
  restTokens: number;
  accentColor: string | null;
  // ---- settings / ai / custom exercises
  updateSettings: (patch: Partial<Settings>) => void;
  updateAI: (patch: Partial<AISettings>) => void;
  addCustomExercise: (ex: Exercise) => void;
}

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------

function freshMuscles(): Record<MuscleId, MuscleGroup> {
  const m = {} as Record<MuscleId, MuscleGroup>;
  for (const id of MUSCLE_IDS) m[id] = createInitialMuscle(id);
  return m;
}

function freshPlayer(): Player {
  return {
    name: "Hunter",
    level: 1,
    exp: 0,
    expToNext: expForLevel(1),
    hunterRank: "E",
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    statPoints: 0,
    stats: { STR: 10, VIT: 10, AGI: 10, INT: 10, PER: 10 },
    titles: [],
    activeTitle: null,
    streak: 0,
    longestStreak: 0,
    gold: 0,
  };
}

function freshAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFS.map((a) => ({ ...a, unlocked: false }));
}

function initialPersisted(): PersistedState {
  return {
    onboarded: false,
    player: freshPlayer(),
    profile: null,
    muscles: freshMuscles(),
    exercises: SEED_EXERCISES,
    quest: null,
    questTemplate: DEFAULT_QUEST_TEMPLATE,
    debuff: NO_DEBUFF,
    pendingPenalty: false,
    settings: {
      penaltyDifficulty: "standard",
      units: "metric",
      reminderTime: null,
      soundEnabled: false,
    },
    ai: { groqApiKey: null, model: "llama-3.3-70b-versatile", enabled: false },
    achievements: freshAchievements(),
    bosses: [],
    logs: [],
    statXp: {},
    lastSeen: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePlayer = create<StoreState>((set, get) => ({
  ...initialPersisted(),
  hydrated: false,
  lastTrainedMuscles: [],
  restTokens: 0,
  accentColor: null,

  persist: () => {
    const s = get();
    const slice: PersistedState & { restTokens: number; accentColor: string | null } = {
      onboarded: s.onboarded,
      player: s.player,
      profile: s.profile,
      muscles: s.muscles,
      exercises: s.exercises,
      quest: s.quest,
      questTemplate: s.questTemplate,
      debuff: s.debuff,
      pendingPenalty: s.pendingPenalty,
      settings: s.settings,
      ai: s.ai,
      achievements: s.achievements,
      bosses: s.bosses,
      logs: s.logs,
      statXp: s.statXp,
      lastSeen: new Date().toISOString(),
      restTokens: s.restTokens,
      accentColor: s.accentColor,
    };
    void storage.set(STORE_KEY, slice);
  },

  hydrate: async () => {
    const saved = await storage.get<PersistedState & { restTokens?: number; accentColor?: string | null }>(
      STORE_KEY,
    );
    if (saved) {
      // Apply fatigue decay for time elapsed since last open.
      const now = new Date();
      const hours = saved.lastSeen ? hoursBetween(saved.lastSeen, now.toISOString()) : 0;
      const muscles = { ...saved.muscles };
      for (const id of MUSCLE_IDS) {
        const m = muscles[id] ?? createInitialMuscle(id);
        muscles[id] = { ...m, fatigue: decayedFatigue(m.fatigue, Math.max(0, hours)) };
      }
      // Expire debuff if its timer passed.
      let debuff = saved.debuff ?? NO_DEBUFF;
      if (isDebuffExpired(debuff, now)) debuff = NO_DEBUFF;

      set({
        ...initialPersisted(),
        ...saved,
        muscles,
        debuff,
        restTokens: saved.restTokens ?? 0,
        accentColor: saved.accentColor ?? null,
        hydrated: true,
      });
    } else {
      set({ hydrated: true });
    }
    get().ensureDailyQuest();
  },

  resetAll: async () => {
    await storage.remove(STORE_KEY);
    set({ ...initialPersisted(), hydrated: true, restTokens: 0, accentColor: null });
  },

  // -------------------------------------------------------------------------
  completeOnboarding: (profile, name, startBonusExp) => {
    const player = freshPlayer();
    player.name = name || "Hunter";
    // Apply baseline-test bonus EXP across the player + spread to muscles evenly.
    const res = applyExp(player.level, player.exp, startBonusExp);
    player.level = res.level;
    player.exp = res.exp;
    player.expToNext = res.expToNext;
    player.hunterRank = hunterRankForLevel(res.level);
    player.statPoints = res.levelsGained * 3;
    player.maxHp = maxHpForStats(player.level, player.stats.VIT);
    player.hp = player.maxHp;
    player.maxMp = maxMpForStats(player.level, player.stats.INT);
    player.mp = player.maxMp;

    const muscles = freshMuscles();
    const perMuscle = Math.round((startBonusExp * 0.5) / MUSCLE_IDS.length);
    for (const id of MUSCLE_IDS) {
      muscles[id] = { ...muscles[id]!, exp: perMuscle, rank: rankForExp(perMuscle) };
    }

    set({ profile, player, muscles, onboarded: true });
    notify(
      "info",
      "[ SYSTEM ]",
      `Welcome, ${player.name}. You have acquired the qualifications to be a Player.`,
    );
    get().ensureDailyQuest();
    get().persist();
  },

  // -------------------------------------------------------------------------
  ensureDailyQuest: () => {
    const s = get();
    const today = localDateKey();
    if (s.quest && s.quest.date === today) return;

    // A quest from a previous day exists → evaluate failure for the most recent.
    if (s.quest && s.quest.date !== today) {
      const wasComplete = s.quest.status === "complete" || isQuestComplete(s.quest);
      if (!wasComplete) {
        applyPenalty(get, set);
      }
    }

    const base = generateDailyQuest(s.questTemplate, s.player.level, s.profile);
    const quest = s.pendingPenalty ? generatePenaltyQuest(base) : base;
    if (s.pendingPenalty) {
      notify(
        "alert",
        "[ PENALTY QUEST ]",
        "A Penalty Quest has manifested. Clear it to lift the Penalty Zone debuff.",
      );
    }
    set({ quest, pendingPenalty: false });
    get().persist();
  },

  // -------------------------------------------------------------------------
  logExercise: (exerciseId, amount, source = "manual") => {
    if (amount <= 0) return;
    const s = get();
    const exMap = buildExerciseMap(s.exercises);
    const exercise = exMap[exerciseId];
    if (!exercise) return;

    const debuffMult = s.debuff.active ? s.debuff.expMultiplier : 1;
    const result = computeTraining(exercise, amount, s.muscles, debuffMult);

    // ---- muscles
    const muscles = { ...s.muscles };
    const trained: MuscleId[] = [];
    const rankUps: { id: MuscleId; from: string; to: string }[] = [];
    for (const id of Object.keys(result.muscleExp) as MuscleId[]) {
      const m = muscles[id] ?? createInitialMuscle(id);
      const before = rankForExp(m.exp);
      const newExp = m.exp + (result.muscleExp[id] ?? 0);
      const after = rankForExp(newExp);
      muscles[id] = {
        ...m,
        exp: newExp,
        rank: after,
        fatigue: Math.min(100, m.fatigue + (result.muscleFatigue[id] ?? 0)),
        lastTrained: new Date().toISOString(),
      };
      trained.push(id);
      if (before !== after) rankUps.push({ id, from: before, to: after });
    }

    // ---- player exp / level
    const lvl = applyExp(s.player.level, s.player.exp, result.totalExp);
    const player = { ...s.player };
    player.level = lvl.level;
    player.exp = lvl.exp;
    player.expToNext = lvl.expToNext;
    player.hunterRank = hunterRankForLevel(lvl.level);

    // ---- stat XP accumulation → passive small stat gains
    const statXp = { ...s.statXp };
    for (const [stat, val] of Object.entries(result.statGains) as [StatKey, number][]) {
      statXp[stat] = (statXp[stat] ?? 0) + val;
      while ((statXp[stat] ?? 0) >= 50) {
        statXp[stat] = (statXp[stat] ?? 0) - 50;
        player.stats = { ...player.stats, [stat]: player.stats[stat] + 1 };
      }
    }

    // ---- level-up handling
    if (lvl.levelsGained > 0) {
      const prevRank = s.player.hunterRank;
      let granted = 0;
      for (let l = s.player.level + 1; l <= lvl.level; l++) granted += statPointsForLevelUp(l);
      player.statPoints += granted;
      player.maxHp = maxHpForStats(player.level, player.stats.VIT);
      player.maxMp = maxMpForStats(player.level, player.stats.INT);
      player.hp = player.maxHp;
      notify(
        "levelup",
        "[ LEVEL UP ]",
        `You reached Level ${player.level}. +${granted} stat points to allocate.`,
      );
      if (player.hunterRank !== prevRank) {
        notify(
          "rankup",
          "[ PROMOTION ]",
          `Hunter Rank increased to ${player.hunterRank}. The System recognizes your growth.`,
        );
      }
    }

    // ---- muscle rank-ups
    for (const ru of rankUps) {
      notify(
        "rankup",
        "[ RANK UP ]",
        `${muscles[ru.id]!.label} advanced ${ru.from} → ${ru.to}.`,
      );
    }

    // ---- quest progress
    let quest = s.quest;
    let questJustCompleted = false;
    if (quest && quest.status === "active") {
      const items = quest.items.map((it) =>
        it.exerciseId === exerciseId
          ? { ...it, completed: it.completed + amount }
          : it,
      );
      quest = { ...quest, items };
      if (isQuestComplete(quest)) {
        quest = { ...quest, status: "complete" };
        questJustCompleted = true;
      }
    }

    // ---- bosses
    const bosses = s.bosses.map((b) => {
      if (b.defeated || b.exerciseId !== exerciseId) return b;
      const progress = Math.max(b.progress, amount); // best single effort
      if (progress >= b.benchmark) {
        notify("success", "[ BOSS DEFEATED ]", `${b.name} has fallen. Title earned: ${b.rewardTitle}.`);
        return { ...b, progress: b.benchmark, defeated: true };
      }
      return { ...b, progress };
    });

    // ---- logs
    const logs = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: new Date().toISOString(),
        exerciseId,
        amount,
        expGained: result.totalExp,
        source,
      } as LogEntry,
      ...s.logs,
    ].slice(0, 2000);

    set({ player, muscles, statXp, quest, bosses, logs, lastTrainedMuscles: trained });

    // ---- titles from defeated bosses
    syncBossTitles(get, set);

    // ---- quest completion rewards
    if (questJustCompleted && quest) {
      applyQuestCompletion(get, set, quest);
    }

    evaluateAchievements(get, set);
    get().persist();
  },

  acceptProposedQuest: (items, rewardExp) => {
    const today = localDateKey();
    const quest: DailyQuest = {
      date: today,
      items: items.map((it) => ({ exerciseId: it.exerciseId, target: it.target, completed: 0 })),
      status: "active",
      rewardExp,
    };
    set({ quest });
    notify("info", "[ QUEST UPDATED ]", "The Architect's proposed quest is now active.");
    get().persist();
  },

  setQuestTemplate: (t) => {
    set({ questTemplate: t });
    get().persist();
  },

  // ---- Architect-driven quest edits ---------------------------------------
  // These all mutate the single source of truth in the store, so the change
  // immediately reflects on the HUD, the Daily Quest card, the AI snapshot,
  // and anywhere else that reads `quest`.

  regenerateDailyQuest: () => {
    const s = get();
    const quest = generateDailyQuest(s.questTemplate, s.player.level, s.profile);
    set({ quest });
    notify(
      "info",
      "[ QUEST RECONFIGURED ]",
      "The Architect manifested a fresh Daily Quest. Previous progress was cleared.",
    );
    get().persist();
  },

  resetQuestProgress: () => {
    const s = get();
    if (!s.quest) return;
    const items = s.quest.items.map((it) => ({ ...it, completed: 0 }));
    set({ quest: { ...s.quest, items, status: "active" } });
    notify("info", "[ QUEST RESET ]", "All Daily Quest progress has been reset to zero.");
    get().persist();
  },

  resetQuestItem: (exerciseId) => {
    const s = get();
    if (!s.quest) return;
    let found = false;
    const items = s.quest.items.map((it) => {
      if (it.exerciseId !== exerciseId) return it;
      found = true;
      return { ...it, completed: 0 };
    });
    if (!found) return;
    // A reset can un-complete the quest; restore it to active in that case.
    const status = s.quest.status === "complete" ? "active" : s.quest.status;
    const exMap = buildExerciseMap(s.exercises);
    set({ quest: { ...s.quest, items, status } });
    notify(
      "info",
      "[ OBJECTIVE RESET ]",
      `${exMap[exerciseId]?.name ?? exerciseId} progress reset to 0.`,
    );
    get().persist();
  },

  setQuestItemProgress: (exerciseId, completed) => {
    const s = get();
    if (!s.quest) return;
    let found = false;
    const items = s.quest.items.map((it) => {
      if (it.exerciseId !== exerciseId) return it;
      found = true;
      const clamped = Math.max(0, Math.min(it.target, Math.round(completed)));
      return { ...it, completed: clamped };
    });
    if (!found) return;
    const status = s.quest.status === "complete" ? "active" : s.quest.status;
    const exMap = buildExerciseMap(s.exercises);
    const updated = items.find((it) => it.exerciseId === exerciseId)!;
    set({ quest: { ...s.quest, items, status } });
    notify(
      "info",
      "[ OBJECTIVE UPDATED ]",
      `${exMap[exerciseId]?.name ?? exerciseId} set to ${updated.completed}/${updated.target}.`,
    );
    get().persist();
  },

  // -------------------------------------------------------------------------
  allocateStat: (stat) => {
    const s = get();
    if (s.player.statPoints <= 0) return;
    const player = { ...s.player, statPoints: s.player.statPoints - 1 };
    player.stats = { ...player.stats, [stat]: player.stats[stat] + 1 };
    if (stat === "VIT") player.maxHp = maxHpForStats(player.level, player.stats.VIT);
    if (stat === "INT") player.maxMp = maxMpForStats(player.level, player.stats.INT);
    set({ player });
    get().persist();
  },

  setActiveTitle: (title) => {
    set((s) => ({ player: { ...s.player, activeTitle: title } }));
    get().persist();
  },

  // -------------------------------------------------------------------------
  createBoss: (boss) => {
    const newBoss: Boss = {
      ...boss,
      id: `boss-${Date.now()}`,
      progress: 0,
      defeated: false,
      maxHp: boss.benchmark,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ bosses: [...s.bosses, newBoss] }));
    notify("info", "[ BOSS SUMMONED ]", `${newBoss.name} now stands between you and your goal.`);
    get().persist();
  },

  completeDungeon: (d) => {
    const s = get();
    if (s.player.mp < d.mpCost) {
      notify("alert", "[ INSUFFICIENT FOCUS ]", "Not enough MP/Focus to clear this dungeon.");
      return;
    }
    const lvl = applyExp(s.player.level, s.player.exp, d.rewardExp);
    const player = { ...s.player };
    player.mp = Math.max(0, s.player.mp - d.mpCost);
    player.level = lvl.level;
    player.exp = lvl.exp;
    player.expToNext = lvl.expToNext;
    player.hunterRank = hunterRankForLevel(lvl.level);
    player.gold = s.player.gold + d.rewardGold;
    if (lvl.levelsGained > 0) {
      let granted = 0;
      for (let l = s.player.level + 1; l <= lvl.level; l++) granted += statPointsForLevelUp(l);
      player.statPoints += granted;
      notify("levelup", "[ LEVEL UP ]", `Dungeon cleared — Level ${player.level}.`);
    }
    set({ player });
    notify("success", "[ DUNGEON CLEARED ]", `${d.name} conquered. +${d.rewardExp} EXP, +${d.rewardGold} gold.`);
    // count dungeon exercises as training
    for (const ex of d.exercises) get().logExercise(ex.exerciseId, ex.target, "dungeon");
    evaluateAchievements(get, set, { dungeonCleared: true });
    get().persist();
  },

  // -------------------------------------------------------------------------
  buyItem: (cost, effect, payload) => {
    const s = get();
    if (s.player.gold < cost) {
      notify("alert", "[ INSUFFICIENT GOLD ]", "You cannot afford this yet.");
      return false;
    }
    const player = { ...s.player, gold: s.player.gold - cost };
    const patch: Partial<StoreState> = { player };
    if (effect === "rest-token") patch.restTokens = s.restTokens + 1;
    if (effect === "accent") patch.accentColor = payload ?? null;
    set(patch);
    notify("success", "[ PURCHASE ]", "Item acquired from the Shop.");
    get().persist();
    return true;
  },

  // -------------------------------------------------------------------------
  updateSettings: (patch) => {
    set((s) => ({ settings: { ...s.settings, ...patch } }));
    get().persist();
  },
  updateAI: (patch) => {
    set((s) => ({ ai: { ...s.ai, ...patch } }));
    get().persist();
  },
  addCustomExercise: (ex) => {
    set((s) => ({ exercises: [...s.exercises, { ...ex, custom: true }] }));
    get().persist();
  },
}));

// ---------------------------------------------------------------------------
// Internal helpers operating on the store
// ---------------------------------------------------------------------------

type StoreGet = typeof usePlayer.getState;
type StoreSet = (partial: Partial<StoreState>) => void;

function applyQuestCompletion(get: StoreGet, set: StoreSet, quest: DailyQuest): void {
  const s = get();
  const lvl = applyExp(s.player.level, s.player.exp, quest.rewardExp);
  const player = { ...s.player };
  player.level = lvl.level;
  player.exp = lvl.exp;
  player.expToNext = lvl.expToNext;
  player.hunterRank = hunterRankForLevel(lvl.level);
  player.streak = s.player.streak + 1;
  player.longestStreak = Math.max(s.player.longestStreak, player.streak);
  player.gold = s.player.gold + 40 + Math.round(quest.rewardExp / 20);
  // small chance of bonus stat point
  if (Math.random() < 0.35) player.statPoints += 1;

  if (lvl.levelsGained > 0) {
    let granted = 0;
    for (let l = s.player.level + 1; l <= lvl.level; l++) granted += statPointsForLevelUp(l);
    player.statPoints += granted;
  }

  // Clearing a penalty quest lifts the debuff.
  let debuff = s.debuff;
  if (quest.isPenaltyQuest && s.debuff.active) {
    debuff = NO_DEBUFF;
    notify("success", "[ PENALTY CLEARED ]", "The Penalty Zone debuff has been lifted.");
  }

  set({ player, debuff });
  notify(
    "success",
    "[ DAILY QUEST COMPLETE ]",
    `+${quest.rewardExp} EXP. Streak: ${player.streak} day${player.streak === 1 ? "" : "s"}.`,
  );
}

function applyPenalty(get: StoreGet, set: StoreSet): void {
  const s = get();
  const cfg = PENALTY_CONFIG[s.settings.penaltyDifficulty];

  // Auto-consume a Rest Token to shield the streak, if available.
  if (s.restTokens > 0) {
    set({ restTokens: s.restTokens - 1, quest: { ...s.quest!, status: "failed" } });
    notify("info", "[ REST TOKEN USED ]", "A Rest Token absorbed the penalty. Streak preserved.");
    return;
  }

  const player = { ...s.player };
  if (cfg.expLossRatio > 0) {
    const loss = Math.round(expForLevel(player.level) * cfg.expLossRatio);
    const after = removeExp(player.level, player.exp, loss);
    player.level = after.level;
    player.exp = after.exp;
    player.expToNext = after.expToNext;
    player.hunterRank = hunterRankForLevel(after.level);
  }
  player.streak = 0;

  const debuff: Debuff = buildDebuff(s.settings.penaltyDifficulty);
  set({
    player,
    debuff,
    pendingPenalty: cfg.spawnPenaltyQuest,
    quest: s.quest ? { ...s.quest, status: "failed" } : s.quest,
  });
  notify(
    "alert",
    "[ ALERT ]",
    "Daily Quest incomplete. Penalty Zone activated. Streak reset and a debuff applied.",
  );
}

function syncBossTitles(get: StoreGet, set: StoreSet): void {
  const s = get();
  const earned = s.bosses.filter((b) => b.defeated).map((b) => b.rewardTitle);
  const titles = Array.from(new Set([...s.player.titles, ...earned]));
  if (titles.length !== s.player.titles.length) {
    set({ player: { ...s.player, titles } });
  }
}

function evaluateAchievements(get: StoreGet, set: StoreSet, ctx?: { dungeonCleared?: boolean }): void {
  const s = get();
  const muscles = s.muscles;
  const rankAtLeast = (id: MuscleId, min: number) => {
    const order = ["E", "D", "C", "B", "A", "S", "SS"];
    return order.indexOf(rankForExp(muscles[id]!.exp)) >= min;
  };

  const conditions: Record<string, boolean> = {
    "first-blood": s.logs.length >= 1,
    "first-quest": s.logs.length >= 1 && s.player.streak >= 1,
    "streak-7": s.player.longestStreak >= 7,
    "iron-will": s.player.longestStreak >= 30,
    unbroken: s.player.longestStreak >= 100,
    "level-10": s.player.level >= 10,
    "level-35": s.player.level >= 35,
    "level-80": s.player.level >= 80,
    "deltoid-dominator": rankAtLeast("shoulders", 5),
    "iron-back": rankAtLeast("back", 4),
    "leg-day": rankAtLeast("quads", 4),
    balanced: MUSCLE_IDS.every((id) => rankAtLeast(id, 2)),
    "boss-slayer": s.bosses.some((b) => b.defeated),
    "dungeon-diver": ctx?.dungeonCleared === true || s.achievements.find((a) => a.id === "dungeon-diver")?.unlocked === true,
  };

  let changed = false;
  const titles = [...s.player.titles];
  const achievements = s.achievements.map((a) => {
    if (!a.unlocked && conditions[a.id]) {
      changed = true;
      if (!titles.includes(a.title)) titles.push(a.title);
      notify("success", "[ ACHIEVEMENT ]", `${a.title} — ${a.description}`);
      return { ...a, unlocked: true, unlockedAt: new Date().toISOString() };
    }
    return a;
  });
  if (changed) set({ achievements, player: { ...s.player, titles } });
}

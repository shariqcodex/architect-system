# THE SYSTEM — Hunter Protocol

A **Solo Leveling–style fitness RPG**. You are a real-life Hunter who levels up by training. The centerpiece is a **living body avatar** — an anatomical figure whose individual muscle groups gain EXP, rank up (E → D → C → B → A → S → SS), and visibly glow and grow as you train them. Daily Quests count down to local midnight, completing them awards EXP, and failing triggers a Penalty Zone. An optional **Groq-powered AI coach ("The Architect")** reads your live stats and gives age-aware, data-aware guidance.

Built with Next.js 14 (App Router) · TypeScript (strict) · Tailwind · Zustand · Framer Motion · Recharts · Lucide.

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. On first launch you'll go through the **Awakening** onboarding (name, age, baseline tests) which calibrates your starting ranks and quest difficulty.

All progress is saved to your browser's `localStorage` — no account or server needed.

### Other scripts

```bash
npm run build       # production build
npm run start       # run the production build
npm run typecheck   # tsc --noEmit (strict)
npm run lint        # next lint
```

---

## The AI Coach (optional)

The Architect uses **Groq** (an OpenAI-compatible API). It is fully optional — the game works without it.

1. Get a free API key at <https://console.groq.com/keys>.
2. In the app, go to **Settings → The Architect** and paste the key, then click **Test & save**. The app fetches the available models and lets you pick one (defaults to a strong 70B model with a fast fallback).
3. Visit the **Architect** tab to chat, run a weak-point analysis, or have it propose tomorrow's quest. The **Dungeon** tab can generate custom, age-appropriate challenge workouts.

**Key safety:** your key is stored only on your device and is sent through this app's own server route (`/app/api/coach/route.ts`). The browser never calls Groq directly, and the key is never bundled, logged, or persisted server-side. Free-tier rate limits are handled with user-facing messaging.

---

## How the game works

- **Muscle EXP & ranks** — every logged exercise distributes EXP to the muscles it trains (weighted: primary heavier, secondary lighter). Each muscle has its own rising EXP curve and derived rank. Higher tiers add glow and a subtle size/definition increase on the avatar.
- **Fatigue** — training a muscle raises its fatigue, which *reduces* further EXP gains (diminishing returns) until it recovers over time. Overworked muscles show a red overlay. This nudges balanced, sustainable training.
- **Daily Quest** — generated each day, scaled to your level and onboarding fitness, with a countdown to local midnight. Log with +1 / +5 / +set or manual entry.
- **Penalty Zone** — miss the deadline and the System breaks your streak and applies a debuff (and, on Standard/Hardcore, a harder Penalty Quest the next day). Severity is configurable (Casual / Standard / Hardcore). Rest Tokens from the Shop can shield a streak.
- **Leveling & stats** — total EXP drives your level; level-ups grant stat points (STR/VIT/AGI/INT/PER) you allocate. Overall Hunter Rank is derived from level.
- **Bosses** — turn a long-term goal (e.g. "50 push-ups in one set") into a boss with an HP bar that drains as you log progress. Defeating it grants a title.
- **Instant Dungeons** — opt-in, timed challenge workouts that cost Focus (MP) and pay big EXP + gold.
- **Progress** — radar chart, daily EXP, a 12-week activity heatmap, and per-muscle rank bars.

---

## Project structure

```
/app
  layout.tsx              # fonts, metadata, app frame
  page.tsx                # main HUD: avatar + daily quest + quick train
  /onboarding/page.tsx    # awakening flow (collects profile incl. age)
  /dungeon/page.tsx       # instant dungeons + bosses + shop
  /progress/page.tsx      # Recharts views + streak heatmap
  /coach/page.tsx         # the Architect AI chat
  /profile/page.tsx       # stats allocation, titles, achievements
  /settings/page.tsx      # penalty difficulty, units, Groq key/model, data export
  /api/coach/route.ts     # server-side Groq proxy (streaming, key never exposed)
/components
  /avatar                 # BodyAvatar (layered SVG), MuscleDetailPanel, figureShapes
  /quest                  # DailyQuestCard, CountdownTimer, QuickTrain
  /system                 # SystemNotification host (blue + red variants)
  /hud                    # PlayerHeader, StatPanel
  /charts                 # StatRadar, MuscleRanks, WeeklyVolume, StreakHeatmap
  /dungeon /boss /shop    # gates, boss battles, in-app shop
  /ai                     # CoachPanel, QuestProposalCard
  /ui                     # Panel, Button, ExpBar, RankBadge (themed primitives)
  /layout                 # Nav, AppFrame
/lib
  /engine                 # leveling, muscles, quests, penalty, training, dates (pure)
  /ai                     # groqClient (server), systemPrompt, schemas, snapshot, client
  /data                   # exercises, achievements, dungeons
  /store                  # usePlayer (Zustand), persistence (storage interface), notifications
  /design/tokens.ts       # color/motion tokens (mirrors tailwind config)
/public                   # manifest.json, sw.js, icons (PWA)
```

All game math lives in `/lib/engine` as pure, testable functions. The storage layer sits behind a `StorageAdapter` interface (`/lib/store/persistence.ts`) so a Postgres/Prisma backend can drop in for multi-device sync without touching the UI.

---

## PWA / install on a phone

The app ships a manifest and a minimal offline-shell service worker (registered in production builds). After `npm run build && npm run start`, open it on your phone's browser and **Add to Home Screen** to install it.

---

## Deploy

Works on **Vercel** or **Railway** out of the box (it's a standard Next.js app, no env vars required — the Groq key is entered in-app, not via server env). Push the repo and deploy; for Railway, the start command is `npm run start` after `npm run build`.

---

## Notes

- Dark, holographic sci-fi HUD theme only (v1). Design tokens in `tailwind.config.ts` + `lib/design/tokens.ts`.
- Fitness guidance from the Architect is **general information, not medical advice**. Consult a professional for pain, conditions, or pregnancy.
- All in-app currency is purely cosmetic/utility — there is no real-money monetization.

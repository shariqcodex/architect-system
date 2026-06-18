"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Download, Trash2, Plus } from "lucide-react";
import type { Exercise, MuscleId, PenaltyDifficulty } from "@/lib/types";
import { MUSCLE_IDS } from "@/lib/types";
import { usePlayer } from "@/lib/store/usePlayer";
import { MUSCLE_LABELS } from "@/lib/data/exercises";
import { fetchModels, testConnection } from "@/lib/ai/client";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

const inputCls =
  "h-9 w-full rounded-inset border border-border bg-bg-900 px-3 font-mono text-xs text-text-hi outline-none focus:border-border-hi";

export default function SettingsPage() {
  const settings = usePlayer((s) => s.settings);
  const ai = usePlayer((s) => s.ai);
  const updateSettings = usePlayer((s) => s.updateSettings);
  const updateAI = usePlayer((s) => s.updateAI);
  const resetAll = usePlayer((s) => s.resetAll);
  const addCustomExercise = usePlayer((s) => s.addCustomExercise);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-text-hi">Settings</h1>

      <Panel corners title="[ Penalty & Difficulty ]">
        <div className="mb-2 font-mono text-[11px] text-text-mid">
          How harshly the System responds when a Daily Quest is failed.
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(["casual", "standard", "hardcore"] as PenaltyDifficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => updateSettings({ penaltyDifficulty: d })}
              className={cn(
                "rounded-inset border px-3 py-2.5 text-left",
                settings.penaltyDifficulty === d ? "border-accent/50 bg-accent/10" : "border-border bg-bg-800/50 hover:border-border-hi",
              )}
            >
              <div className="font-display text-sm font-semibold capitalize text-text-hi">{d}</div>
              <div className="font-mono text-[10px] text-text-low">
                {d === "casual" && "No EXP loss · mild debuff · streak kept"}
                {d === "standard" && "−10% EXP · debuff · penalty quest"}
                {d === "hardcore" && "−25% EXP · heavy debuff · penalty quest"}
              </div>
            </button>
          ))}
        </div>
      </Panel>

      <Panel corners title="[ Preferences ]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block font-display text-[10px] uppercase tracking-widest text-text-low">Units</span>
            <select className={inputCls} value={settings.units} onChange={(e) => updateSettings({ units: e.target.value as "metric" | "imperial" })}>
              <option value="metric">Metric (kg, km)</option>
              <option value="imperial">Imperial (lb, mi)</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-display text-[10px] uppercase tracking-widest text-text-low">Daily reminder</span>
            <input
              className={inputCls}
              type="time"
              value={settings.reminderTime ?? ""}
              onChange={(e) => updateSettings({ reminderTime: e.target.value || null })}
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 pt-5">
            <input type="checkbox" checked={settings.soundEnabled} onChange={(e) => updateSettings({ soundEnabled: e.target.checked })} className="h-4 w-4 accent-[#3DA9FC]" />
            <span className="font-mono text-xs text-text-mid">Notification sound</span>
          </label>
        </div>
      </Panel>

      <ArchitectSettings ai={ai} updateAI={updateAI} testConnection={testConnection} fetchModels={fetchModels} />

      <CustomExerciseForm onAdd={addCustomExercise} />

      <Panel corners title="[ Data ]">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="subtle"
            onClick={() => {
              const raw = window.localStorage.getItem("the-system:state-v1") ?? "{}";
              const blob = new Blob([raw], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "the-system-save.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={14} /> Export save
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm("Reset ALL progress? This cannot be undone.")) void resetAll();
            }}
          >
            <Trash2 size={14} /> Reset all progress
          </Button>
        </div>
      </Panel>
    </div>
  );
}

function ArchitectSettings({
  ai,
  updateAI,
  testConnection,
  fetchModels,
}: {
  ai: { groqApiKey: string | null; model: string; enabled: boolean };
  updateAI: (patch: Partial<{ groqApiKey: string | null; model: string; enabled: boolean }>) => void;
  testConnection: (key: string) => Promise<number>;
  fetchModels: (key: string) => Promise<string[]>;
}) {
  const [key, setKey] = useState(ai.groqApiKey ?? "");
  const [models, setModels] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  const test = async () => {
    if (!key.trim()) return;
    setStatus("testing");
    setMsg("");
    try {
      const list = await fetchModels(key.trim());
      setModels(list);
      updateAI({ groqApiKey: key.trim(), enabled: true });
      if (list.length && !list.includes(ai.model)) {
        const preferred = list.find((m) => m.includes("70b")) ?? list[0]!;
        updateAI({ model: preferred });
      }
      setStatus("ok");
      setMsg(`Connected. ${list.length} models available.`);
    } catch (e) {
      setStatus("error");
      setMsg(e instanceof Error ? e.message : "Connection failed.");
    }
  };

  return (
    <Panel corners title="[ The Architect — AI Coach (Groq) ]">
      <p className="mb-3 font-mono text-[11px] leading-relaxed text-text-mid">
        Get a free Groq API key at{" "}
        <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-accent underline">
          console.groq.com/keys
        </a>
        . Your key is stored only on this device and is sent through this app&apos;s own server route — never to the browser bundle or any third party except Groq.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className={inputCls}
          type="password"
          placeholder="gsk_..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoComplete="off"
        />
        <Button onClick={test} disabled={status === "testing" || !key.trim()} className="h-9 shrink-0">
          {status === "testing" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          Test &amp; save
        </Button>
      </div>

      {msg && (
        <p className={cn("mt-2 font-mono text-[11px]", status === "error" ? "text-danger" : "text-success")}>{msg}</p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block font-display text-[10px] uppercase tracking-widest text-text-low">Model</span>
          {models.length > 0 ? (
            <select className={inputCls} value={ai.model} onChange={(e) => updateAI({ model: e.target.value })}>
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <input className={inputCls} value={ai.model} onChange={(e) => updateAI({ model: e.target.value })} />
          )}
        </label>
        <label className="flex cursor-pointer items-center gap-2 pt-5">
          <input
            type="checkbox"
            checked={ai.enabled}
            onChange={(e) => updateAI({ enabled: e.target.checked })}
            className="h-4 w-4 accent-[#3DA9FC]"
          />
          <span className="font-mono text-xs text-text-mid">Enable the Architect</span>
        </label>
      </div>
    </Panel>
  );
}

function CustomExerciseForm({ onAdd }: { onAdd: (ex: Exercise) => void }) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<Exercise["unit"]>("reps");
  const [primary, setPrimary] = useState<MuscleId>("chest");
  const [secondary, setSecondary] = useState<MuscleId | "">("");
  const [expPerUnit, setExpPerUnit] = useState("2");

  const submit = () => {
    if (!name.trim()) return;
    const muscleWeights: Partial<Record<MuscleId, number>> = secondary
      ? { [primary]: 0.7, [secondary]: 0.3 }
      : { [primary]: 1 };
    onAdd({
      id: `custom-${name.trim().toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`,
      name: name.trim(),
      unit,
      muscleWeights,
      statWeights: { STR: 1 },
      expPerUnit: Math.max(0.1, parseFloat(expPerUnit) || 2),
    });
    setName("");
  };

  return (
    <Panel corners title="[ Custom Exercise ]">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block font-display text-[10px] uppercase tracking-widest text-text-low">Name</span>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Diamond Push-ups" />
        </label>
        <label className="block">
          <span className="mb-1 block font-display text-[10px] uppercase tracking-widest text-text-low">Unit</span>
          <select className={inputCls} value={unit} onChange={(e) => setUnit(e.target.value as Exercise["unit"])}>
            <option value="reps">reps</option>
            <option value="seconds">seconds</option>
            <option value="km">km</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block font-display text-[10px] uppercase tracking-widest text-text-low">EXP per unit</span>
          <input className={inputCls} type="number" value={expPerUnit} onChange={(e) => setExpPerUnit(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block font-display text-[10px] uppercase tracking-widest text-text-low">Primary muscle</span>
          <select className={inputCls} value={primary} onChange={(e) => setPrimary(e.target.value as MuscleId)}>
            {MUSCLE_IDS.map((id) => (
              <option key={id} value={id}>
                {MUSCLE_LABELS[id]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block font-display text-[10px] uppercase tracking-widest text-text-low">Secondary (optional)</span>
          <select className={inputCls} value={secondary} onChange={(e) => setSecondary(e.target.value as MuscleId | "")}>
            <option value="">None</option>
            {MUSCLE_IDS.map((id) => (
              <option key={id} value={id}>
                {MUSCLE_LABELS[id]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Button className="mt-3" onClick={submit} disabled={!name.trim()}>
        <Plus size={14} /> Add exercise
      </Button>
    </Panel>
  );
}

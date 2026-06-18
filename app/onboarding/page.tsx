"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Zap } from "lucide-react";
import type { UserProfile } from "@/lib/types";
import { usePlayer } from "@/lib/store/usePlayer";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";

type Step = 0 | 1 | 2 | 3;

export default function OnboardingPage() {
  const complete = usePlayer((s) => s.completeOnboarding);
  const [step, setStep] = useState<Step>(0);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<UserProfile["sex"]>("prefer_not_to_say");
  const [experience, setExperience] = useState<UserProfile["experience"]>("novice");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [goals, setGoals] = useState("");
  const [injuries, setInjuries] = useState("");

  // baseline tests
  const [maxPush, setMaxPush] = useState("");
  const [maxSquat, setMaxSquat] = useState("");
  const [plankSec, setPlankSec] = useState("");
  const [runKm, setRunKm] = useState("");

  const num = (v: string) => {
    const n = parseFloat(v);
    return Number.isNaN(n) ? 0 : n;
  };

  const finish = () => {
    const profile: UserProfile = {
      age: Math.max(13, Math.round(num(age)) || 25),
      sex,
      experience,
      heightCm: num(heightCm) || undefined,
      weightKg: num(weightKg) || undefined,
      goals: goals.trim() ? goals.split(",").map((g) => g.trim()).filter(Boolean) : [],
      injuries: injuries.trim() ? injuries.split(",").map((g) => g.trim()).filter(Boolean) : [],
    };
    const bonus = Math.min(
      4000,
      Math.round(num(maxPush) * 2.2 + num(maxSquat) * 1.8 + num(plankSec) * 0.6 + num(runKm) * 90),
    );
    complete(profile, name.trim() || "Hunter", bonus);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-lg">
        <div className="mb-5 text-center">
          <div className="font-display text-3xl font-bold uppercase tracking-[0.3em] text-accent text-glow">
            THE SYSTEM
          </div>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-text-low">
            Awakening Protocol
          </p>
        </div>

        <Panel corners>
          <div className="mb-4 flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-bg-600"}`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <Section
                  title="Identity"
                  intro="The System requires a designation, Hunter."
                >
                  <Field label="Name / callsign">
                    <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Hunter" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Age">
                      <input className={inputCls} type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" />
                    </Field>
                    <Field label="Sex">
                      <select className={inputCls} value={sex} onChange={(e) => setSex(e.target.value as UserProfile["sex"])}>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </Field>
                  </div>
                </Section>
              )}

              {step === 1 && (
                <Section title="Calibration" intro="Your metrics calibrate quest difficulty and the Architect's coaching.">
                  <Field label="Experience level">
                    <select className={inputCls} value={experience} onChange={(e) => setExperience(e.target.value as UserProfile["experience"])}>
                      <option value="novice">Novice — new to training</option>
                      <option value="intermediate">Intermediate — train regularly</option>
                      <option value="advanced">Advanced — seasoned</option>
                    </select>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Height (cm)">
                      <input className={inputCls} type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="175" />
                    </Field>
                    <Field label="Weight (kg)">
                      <input className={inputCls} type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="70" />
                    </Field>
                  </div>
                </Section>
              )}

              {step === 2 && (
                <Section title="Baseline Trial" intro="Perform each to your honest max. These set your starting ranks. Leave blank if unknown.">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Max push-ups">
                      <input className={inputCls} type="number" value={maxPush} onChange={(e) => setMaxPush(e.target.value)} placeholder="0" />
                    </Field>
                    <Field label="Max squats">
                      <input className={inputCls} type="number" value={maxSquat} onChange={(e) => setMaxSquat(e.target.value)} placeholder="0" />
                    </Field>
                    <Field label="Plank (seconds)">
                      <input className={inputCls} type="number" value={plankSec} onChange={(e) => setPlankSec(e.target.value)} placeholder="0" />
                    </Field>
                    <Field label="Comfortable run (km)">
                      <input className={inputCls} type="number" value={runKm} onChange={(e) => setRunKm(e.target.value)} placeholder="0" />
                    </Field>
                  </div>
                </Section>
              )}

              {step === 3 && (
                <Section title="Directive" intro="What do you seek, Hunter? The Architect uses this to guide you.">
                  <Field label="Goals (comma-separated)">
                    <input className={inputCls} value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="first pull-up, run 5k, build shoulders" />
                  </Field>
                  <Field label="Injuries / limitations to respect (comma-separated)">
                    <input className={inputCls} value={injuries} onChange={(e) => setInjuries(e.target.value)} placeholder="left knee, lower back" />
                  </Field>
                </Section>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 flex items-center justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => (s - 1) as Step)}>
              <ArrowLeft size={14} /> Back
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep((s) => (s + 1) as Step)} disabled={step === 0 && !age}>
                Next <ArrowRight size={14} />
              </Button>
            ) : (
              <Button variant="success" onClick={finish}>
                <Zap size={15} /> Accept the System
              </Button>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-inset border border-border bg-bg-900 px-3 font-mono text-sm text-text-hi outline-none focus:border-border-hi";

function Section({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-lg font-bold uppercase tracking-widest text-text-hi">{title}</h2>
      <p className="mb-4 mt-1 font-mono text-[11px] leading-relaxed text-text-mid">{intro}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-display text-[10px] uppercase tracking-widest text-text-low">{label}</span>
      {children}
    </label>
  );
}

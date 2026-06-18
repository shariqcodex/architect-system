"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { AlertTriangle, ChevronsUp, Sparkles, Trophy, Info } from "lucide-react";
import { useNotifications } from "@/lib/store/useNotifications";
import { usePlayer } from "@/lib/store/usePlayer";
import type { NotificationVariant } from "@/lib/types";

const variantStyle: Record<
  NotificationVariant,
  { border: string; glow: string; text: string; icon: typeof Info }
> = {
  info: { border: "var(--border-hi)", glow: "rgba(61,169,252,0.35)", text: "var(--accent)", icon: Info },
  success: { border: "rgba(54,211,153,0.5)", glow: "rgba(54,211,153,0.3)", text: "var(--success)", icon: Sparkles },
  alert: { border: "rgba(255,77,109,0.6)", glow: "rgba(255,77,109,0.4)", text: "var(--danger)", icon: AlertTriangle },
  levelup: { border: "rgba(245,192,74,0.6)", glow: "rgba(245,192,74,0.4)", text: "#F5C04A", icon: ChevronsUp },
  rankup: { border: "rgba(168,85,247,0.6)", glow: "rgba(168,85,247,0.4)", text: "#C77DFF", icon: Trophy },
};

function Toast({
  id,
  variant,
  header,
  body,
}: {
  id: string;
  variant: NotificationVariant;
  header: string;
  body: string;
}) {
  const dismiss = useNotifications((s) => s.dismiss);
  const style = variantStyle[variant];
  const Icon = style.icon;

  useEffect(() => {
    const t = setTimeout(() => dismiss(id), variant === "alert" ? 7000 : 5000);
    return () => clearTimeout(t);
  }, [id, dismiss, variant]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.97, transition: { duration: 0.18 } }}
      transition={{ duration: 0.26, ease: "easeOut" }}
      onClick={() => dismiss(id)}
      className="pointer-events-auto w-[340px] max-w-[88vw] cursor-pointer overflow-hidden rounded-panel border bg-bg-800/95 backdrop-blur"
      style={{ borderColor: style.border, boxShadow: `0 0 26px ${style.glow}` }}
    >
      <div
        className="flex items-center gap-2 border-b px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.24em]"
        style={{ color: style.text, borderColor: style.border }}
      >
        <Icon size={13} />
        {header}
      </div>
      <div className="px-3 py-2.5 font-mono text-[13px] leading-snug text-text-hi">{body}</div>
    </motion.div>
  );
}

export function SystemNotificationHost() {
  const notices = useNotifications((s) => s.notices);
  const soundEnabled = usePlayer((s) => s.settings.soundEnabled);

  // Optional muted "ding" via WebAudio (no asset). Default off.
  useEffect(() => {
    if (!soundEnabled || notices.length === 0) return;
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      o.type = "sine";
      g.gain.value = 0.04;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.12);
    } catch {
      /* ignore audio errors */
    }
  }, [notices.length, soundEnabled]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-3">
      <AnimatePresence mode="popLayout">
        {notices.slice(-4).map((n) => (
          <Toast key={n.id} id={n.id} variant={n.variant} header={n.header} body={n.body} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Local-timezone date helpers. Quest deadline is always local midnight.

/** Local YYYY-MM-DD for a date (defaults to now). */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Next local midnight (end of today) as a Date. */
export function nextMidnight(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setHours(24, 0, 0, 0);
  return d;
}

/** Milliseconds until local midnight. */
export function msUntilMidnight(from: Date = new Date()): number {
  return nextMidnight(from).getTime() - from.getTime();
}

/** Hours between two ISO strings (b - a). */
export function hoursBetween(aIso: string, bIso: string): number {
  return (new Date(bIso).getTime() - new Date(aIso).getTime()) / 3_600_000;
}

/** Format remaining ms as HH:MM:SS. */
export function formatCountdown(ms: number): string {
  if (ms < 0) ms = 0;
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/** Returns date keys for the last `n` days, oldest first. */
export function lastNDays(n: number, from: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(from);
    d.setDate(d.getDate() - i);
    keys.push(localDateKey(d));
  }
  return keys;
}

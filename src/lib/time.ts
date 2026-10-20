export const MINUTE = 60e3;
export const DAY = 864e5;
/** The study day rolls over at 4am local time, like Anki. */
const ROLLOVER = 4 * 3600e3;

/** Epoch ms of 4am local on the study day containing `t`. */
export function dayStart(t: number): number {
  const d = new Date(t - ROLLOVER);
  d.setHours(0, 0, 0, 0);
  return d.getTime() + ROLLOVER;
}

export function dayKey(t: number): string {
  const d = new Date(t - ROLLOVER);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Short human interval: 1m, 10m, 6h, 3d, 1.5mo, 2y. */
export function fmtIvl(ms: number): string {
  const m = ms / MINUTE;
  if (m < 60) return Math.max(1, Math.round(m)) + 'm';
  const h = m / 60;
  if (h < 20) return Math.round(h) + 'h';
  const d = Math.round(ms / DAY);
  if (d < 31) return Math.max(1, d) + 'd';
  if (d < 365) return (d / 30).toFixed(1).replace('.0', '') + 'mo';
  return (d / 365).toFixed(1).replace('.0', '') + 'y';
}

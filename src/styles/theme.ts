/** Цвета темы в виде строк — для SVG и three.js (CSS-переменные там недоступны). */
export const theme = {
  bg: '#0b0f19',
  bg2: '#0f1522',
  surface: '#121826',
  surface2: '#182033',
  border: '#1f2937',
  border2: '#2b3648',
  text: '#e5e7eb',
  muted: '#9ca3af',
  muted2: '#6b7280',
  accent: '#2dd4bf',
  accent2: '#a78bfa',
  warn: '#fbbf24',
  danger: '#f87171',
  ok: '#4ade80',
  blue: '#60a5fa',
  pink: '#f472b6',
  orange: '#fb923c',
} as const;

export const CLUSTER_COLORS = ['#2dd4bf', '#a78bfa', '#fbbf24', '#f87171', '#60a5fa', '#f472b6', '#4ade80', '#fb923c'] as const;
export const CHIP_COLORS = ['#2dd4bf', '#a78bfa', '#fbbf24', '#f87171', '#60a5fa', '#f472b6'] as const;

/** Линейная интерполяция между двумя hex-цветами, t ∈ [0, 1]. */
export function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const k = Math.max(0, Math.min(1, t));
  const ch = (shift: number) => {
    const x = (pa >> shift) & 255;
    const y = (pb >> shift) & 255;
    return Math.round(x + (y - x) * k);
  };
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

/** Шкала «фон → акцент → тёплый» для тепловых карт, v ∈ [0, 1]. */
export function heatColor(v: number): string {
  const t = Math.max(0, Math.min(1, v));
  if (t < 0.5) return mixHex('#141b2b', '#2dd4bf', t / 0.5);
  return mixHex('#2dd4bf', '#fbbf24', (t - 0.5) / 0.5);
}

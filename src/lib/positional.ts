/** Синусоидальное позиционное кодирование (Vaswani et al., 2017). */
export function sinusoidalPE(pos: number, i: number, d: number): number {
  const k = Math.floor(i / 2);
  const angle = pos / Math.pow(10000, (2 * k) / d);
  return i % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
}

export function peMatrix(positions: number, d: number): number[][] {
  return Array.from({ length: positions }, (_, pos) => Array.from({ length: d }, (_, i) => sinusoidalPE(pos, i, d)));
}

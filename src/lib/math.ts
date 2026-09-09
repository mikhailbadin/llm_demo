export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const sum = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0);

/** softmax с температурой: p_i = exp(z_i / T) / Σ exp(z_j / T). */
export function softmax(z: readonly number[], temperature = 1): number[] {
  const t = Math.max(temperature, 1e-6);
  const scaled = z.map((v) => v / t);
  const m = Math.max(...scaled);
  const e = scaled.map((v) => Math.exp(v - m));
  const s = sum(e);
  return e.map((v) => v / s);
}

export function logSoftmax(z: readonly number[], temperature = 1): number[] {
  return softmax(z, temperature).map((p) => Math.log(Math.max(p, 1e-300)));
}

/** Энтропия распределения в натах. */
export function entropy(p: readonly number[]): number {
  return -sum(p.map((x) => (x > 0 ? x * Math.log(x) : 0)));
}

/** Cross-entropy между истинным p и предсказанным q. */
export function crossEntropy(p: readonly number[], q: readonly number[]): number {
  return -sum(p.map((x, i) => (x > 0 ? x * Math.log(Math.max(q[i], 1e-300)) : 0)));
}

export const perplexity = (loss: number) => Math.exp(loss);
export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
export const norm = (a: readonly number[]) => Math.sqrt(dot(a, a));
export function cosine(a: readonly number[], b: readonly number[]): number {
  const d = norm(a) * norm(b);
  return d === 0 ? 0 : dot(a, b) / d;
}

export function argmax(xs: readonly number[]): number {
  let best = 0;
  for (let i = 1; i < xs.length; i++) if (xs[i] > xs[best]) best = i;
  return best;
}

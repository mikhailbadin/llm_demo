import { softmax } from './math';
import type { Rng } from './rng';

export interface Candidate {
  token: string;
  p: number;
}

export interface SamplingOptions {
  temperature: number;
  /** null — без отсечения */
  topK: number | null;
  /** null — без отсечения */
  topP: number | null;
}

export interface Transformed {
  token: string;
  /** исходная вероятность (T = 1) */
  pOriginal: number;
  /** после температуры */
  pTemp: number;
  /** после отсечения и перенормировки; 0 у отсечённых */
  pFinal: number;
  kept: boolean;
}

/** Применяет температуру к распределению: p_i ∝ p_i^{1/T} (то же, что softmax(log p / T)). */
export function withTemperature(dist: readonly Candidate[], temperature: number): Candidate[] {
  const logits = dist.map((c) => Math.log(Math.max(c.p, 1e-12)));
  const probs = softmax(logits, temperature);
  return dist.map((c, i) => ({ token: c.token, p: probs[i] }));
}

/**
 * Полный конвейер: температура → сортировка → top-k → top-p → перенормировка.
 * Как в стандартных реализациях, top-p считается по вероятностям, перенормированным после top-k.
 * Самый вероятный токен остаётся всегда, даже при крошечном p.
 */
export function transformDistribution(dist: readonly Candidate[], opts: SamplingOptions): Transformed[] {
  const tempered = withTemperature(dist, opts.temperature);
  const rows: Transformed[] = tempered
    .map((c, i) => ({ token: c.token, pOriginal: dist[i].p, pTemp: c.p, pFinal: 0, kept: true }))
    .sort((a, b) => b.pTemp - a.pTemp);

  if (opts.topK !== null && opts.topK > 0) {
    const k = opts.topK;
    rows.forEach((r, i) => {
      if (i >= k) r.kept = false;
    });
  }
  if (opts.topP !== null && opts.topP < 1) {
    const mass = rows.filter((r) => r.kept).reduce((s, r) => s + r.pTemp, 0) || 1;
    let cum = 0;
    for (const r of rows) {
      if (!r.kept) continue;
      if (cum >= opts.topP - 1e-9) {
        r.kept = false;
      } else {
        cum += r.pTemp / mass;
      }
    }
  }
  if (rows.length > 0 && !rows.some((r) => r.kept)) rows[0].kept = true;
  const z = rows.filter((r) => r.kept).reduce((s, r) => s + r.pTemp, 0) || 1;
  for (const r of rows) r.pFinal = r.kept ? r.pTemp / z : 0;
  return rows;
}

/** Индекс токена, выбранного случайно по вероятностям. */
export function sampleIndex(probs: readonly number[], rng: Rng): number {
  const r = rng.next();
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];
    if (r < acc) return i;
  }
  return probs.length - 1;
}

export function greedyIndex(probs: readonly number[]): number {
  let best = 0;
  for (let i = 1; i < probs.length; i++) if (probs[i] > probs[best]) best = i;
  return best;
}

export const DEFAULT_SAMPLING: SamplingOptions = { temperature: 1, topK: null, topP: null };

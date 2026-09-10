import { describe, expect, it } from 'vitest';
import { transformDistribution, withTemperature, sampleIndex, greedyIndex } from '../sampling';
import { createRng } from '../rng';

const dist = [
  { token: 'a', p: 0.5 },
  { token: 'b', p: 0.3 },
  { token: 'c', p: 0.15 },
  { token: 'd', p: 0.05 },
];

describe('температура', () => {
  it('T = 1 не меняет распределение', () => {
    const t = withTemperature(dist, 1);
    t.forEach((c, i) => expect(c.p).toBeCloseTo(dist[i].p, 6));
  });
  it('T → 0 приближается к жадному выбору', () => {
    const t = withTemperature(dist, 0.05);
    expect(t[0].p).toBeGreaterThan(0.99);
  });
});

describe('top-k / top-p', () => {
  it('top-k оставляет k самых вероятных и перенормирует', () => {
    const rows = transformDistribution(dist, { temperature: 1, topK: 2, topP: null });
    expect(rows.filter((r) => r.kept).map((r) => r.token)).toEqual(['a', 'b']);
    expect(rows.reduce((s, r) => s + r.pFinal, 0)).toBeCloseTo(1);
    expect(rows[0].pFinal).toBeCloseTo(0.5 / 0.8);
  });
  it('top-p оставляет минимальное множество с суммой ≥ p', () => {
    const rows = transformDistribution(dist, { temperature: 1, topK: null, topP: 0.8 });
    expect(rows.filter((r) => r.kept).map((r) => r.token)).toEqual(['a', 'b']);
    const rows2 = transformDistribution(dist, { temperature: 1, topK: null, topP: 0.81 });
    expect(rows2.filter((r) => r.kept).map((r) => r.token)).toEqual(['a', 'b', 'c']);
  });
  it('top-p = 1 и top-k = null ничего не отсекают', () => {
    const rows = transformDistribution(dist, { temperature: 1, topK: null, topP: 1 });
    expect(rows.every((r) => r.kept)).toBe(true);
  });
  it('top-p считается по перенормированным после top-k вероятностям', () => {
    // после top-k = 2: a = 0,625, b = 0,375 → top-p = 0,6 оставляет только a
    const rows = transformDistribution(dist, { temperature: 1, topK: 2, topP: 0.6 });
    expect(rows.filter((r) => r.kept).map((r) => r.token)).toEqual(['a']);
    expect(rows[0].pFinal).toBeCloseTo(1);
  });
  it('лидер остаётся даже при крошечном top-p', () => {
    const rows = transformDistribution(dist, { temperature: 1, topK: null, topP: 0 });
    expect(rows[0].kept).toBe(true);
    expect(rows[0].pFinal).toBeCloseTo(1);
  });
});

describe('сэмплирование', () => {
  it('детерминировано при одном seed', () => {
    const a = createRng(7);
    const b = createRng(7);
    const probs = dist.map((d) => d.p);
    const sa = Array.from({ length: 20 }, () => sampleIndex(probs, a));
    const sb = Array.from({ length: 20 }, () => sampleIndex(probs, b));
    expect(sa).toEqual(sb);
    expect(greedyIndex(probs)).toBe(0);
  });
});

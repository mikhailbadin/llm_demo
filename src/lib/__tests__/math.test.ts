import { describe, expect, it } from 'vitest';
import { softmax, entropy, cosine, argmax, crossEntropy, perplexity } from '../math';

describe('softmax', () => {
  it('суммируется в 1', () => {
    const p = softmax([1, 2, 3]);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
    expect(argmax(p)).toBe(2);
  });
  it('низкая температура делает распределение острее', () => {
    const cold = softmax([1, 2, 3], 0.2);
    const hot = softmax([1, 2, 3], 3);
    expect(Math.max(...cold)).toBeGreaterThan(Math.max(...hot));
    expect(entropy(cold)).toBeLessThan(entropy(hot));
  });
  it('устойчив к большим логитам', () => {
    const p = softmax([1000, 1001]);
    expect(p[1]).toBeGreaterThan(p[0]);
    expect(Number.isFinite(p[0])).toBe(true);
  });
});

describe('cosine / cross-entropy', () => {
  it('косинус одинаковых векторов равен 1, перпендикулярных — 0', () => {
    expect(cosine([1, 2], [2, 4])).toBeCloseTo(1);
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0);
  });
  it('perplexity = exp(loss)', () => {
    const q = [0.5, 0.25, 0.25];
    const loss = crossEntropy([1, 0, 0], q);
    expect(loss).toBeCloseTo(Math.log(2));
    expect(perplexity(loss)).toBeCloseTo(2);
  });
});

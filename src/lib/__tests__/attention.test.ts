import { describe, expect, it } from 'vitest';
import { scoresToWeights, prevWordScores } from '../attention';
import { estimateParams } from '../params';
import { ATTENTION_EXAMPLES } from '@/data/attentionExamples';
import { MODEL_PRESETS } from '@/data/presets';

describe('внимание', () => {
  const example = ATTENTION_EXAMPLES[0];
  const n = example.tokens.length;

  it('каждая строка весов суммируется в 1 — и с маской, и без', () => {
    for (const causal of [false, true]) {
      for (const head of example.heads) {
        for (const row of scoresToWeights(head.scores, causal)) {
          expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
        }
      }
    }
  });

  it('причинная маска обнуляет взгляд в будущее', () => {
    const w = scoresToWeights(example.heads[1].scores, true);
    w.forEach((row, i) => row.forEach((v, j) => expect(v).toBe(j > i ? 0 : v)));
    expect(w[3].slice(4).every((v) => v === 0)).toBe(true);
    expect(w[3].slice(0, 4).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
  });

  it('вторая голова связывает «он» с «Кот»', () => {
    const w = scoresToWeights(example.heads[1].scores, false);
    const heIndex = example.tokens.indexOf('он');
    const catIndex = example.tokens.indexOf('Кот');
    const row = w[heIndex];
    expect(row.indexOf(Math.max(...row))).toBe(catIndex);
    expect(row[catIndex]).toBeGreaterThan(0.5);
  });

  it('первая голова смотрит на предыдущее слово', () => {
    const w = scoresToWeights(prevWordScores(n), false);
    for (let i = 1; i < n; i++) {
      expect(w[i].indexOf(Math.max(...w[i]))).toBe(i - 1);
    }
  });
});

describe('оценка числа параметров', () => {
  it('совпадает с официальными размерами известных моделей', () => {
    const byId = Object.fromEntries(MODEL_PRESETS.map((p) => [p.id, estimateParams(p.cfg).total]));
    expect(byId.gpt2 / 1e6).toBeCloseTo(124, 0);
    expect(byId.gpt3 / 1e9).toBeCloseTo(175, 0);
    expect(byId.llama7b / 1e9).toBeGreaterThan(6);
    expect(byId.llama7b / 1e9).toBeLessThan(7.5);
  });

  it('MLP занимает вдвое больше параметров, чем внимание', () => {
    const r = estimateParams(MODEL_PRESETS[0].cfg);
    expect(r.mlp / r.attention).toBeCloseTo(2, 9);
    expect(r.attention + r.mlp + r.embedding + r.positional).toBe(r.total);
  });
});

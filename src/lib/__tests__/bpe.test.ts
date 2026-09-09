import { describe, expect, it } from 'vitest';
import { learnBpe, tokenizeBpe, EOW } from '../bpe';
import { BPE_CORPUS } from '@/data/bpeCorpus';

describe('BPE', () => {
  it('на крошечном корпусе первым сливает самую частую пару', () => {
    const m = learnBpe({ аа: 5, аб: 2 }, 2);
    expect(m.merges[0]).toEqual(['а', 'а' + EOW]);
    expect(m.steps[0].count).toBe(5);
  });
  it('обучается на корпусе курса и находит осмысленные слияния', () => {
    const m = learnBpe(BPE_CORPUS, 60);
    expect(m.merges.length).toBe(60);
    const tokens = m.vocab.slice(m.baseVocab.length);
    expect(tokens.some((t) => t === 'ть' + EOW || t === 'ть')).toBe(true);
    expect(m.steps[59].vocabSize).toBe(m.vocab.length);
  });
  it('токенизирует и восстанавливает текст', () => {
    const m = learnBpe(BPE_CORPUS, 60);
    const toks = tokenizeBpe('модель говорить', m);
    expect(toks.map((t) => t.text).join('')).toBe('модель' + EOW + 'говорить' + EOW);
    expect(toks.every((t) => t.id >= 0)).toBe(true);
    const chars = tokenizeBpe('модель', m, 0);
    expect(chars.length).toBe(6);
  });
});

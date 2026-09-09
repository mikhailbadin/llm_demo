import { describe, expect, it } from 'vitest';
import { trainNgram, nextDistribution, generate, scoreSentence, tokenizeText, detokenize, endSentence, EOS } from '../ngram';
import { createRng } from '../rng';
import { CORPUS } from '@/data/corpus';

const model = trainNgram(CORPUS);

describe('n-gram модель', () => {
  it('распределение суммируется в 1', () => {
    const d = nextDistribution(model, ['кот']);
    expect(d.reduce((s, c) => s + c.p, 0)).toBeCloseTo(1, 6);
  });
  it('после «кот» самое вероятное — «сидит»', () => {
    const d = nextDistribution(model, ['кот']);
    expect(d[0].token).toBe('сидит');
  });
  it('после «кот сидит на» есть несколько вариантов', () => {
    const d = nextDistribution(model, ['кот', 'сидит', 'на']);
    const top = d.slice(0, 4).map((c) => c.token);
    expect(top).toContain('окне');
    expect(top).toContain('диване');
  });
  it('генерация детерминирована по seed и заканчивается', () => {
    const a = generate(model, ['кот'], 12, createRng(3));
    const b = generate(model, ['кот'], 12, createRng(3));
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
    expect(a).not.toContain(EOS);
  });
  it('loss на знакомом предложении ниже, чем на случайном', () => {
    const known = scoreSentence(model, CORPUS[0]);
    const random = scoreSentence(model, 'фиолетовый трактор поёт математику');
    expect(known).toBeLessThan(random);
  });
  it('токенизация и детокенизация', () => {
    expect(tokenizeText('Кот сидит, а собака бежит.')).toEqual(['кот', 'сидит', ',', 'а', 'собака', 'бежит', '.']);
    expect(detokenize(['кот', 'сидит', ',', 'а', 'собака', '.'])).toBe('кот сидит, а собака.');
  });
});

describe('конец предложения', () => {
  it('ставит точку только если её ещё нет', () => {
    expect(endSentence('кот спит')).toBe('кот спит.');
    expect(endSentence('кот спит ')).toBe('кот спит.');
    expect(endSentence('кот спит .')).toBe('кот спит .');
    expect(endSentence('кот спит!')).toBe('кот спит!');
    expect(endSentence('кот спит?')).toBe('кот спит?');
  });
});

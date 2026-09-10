import { describe, expect, it } from 'vitest';
import { analogy, farthestWord, nearestWords } from '../embeddings';
import { dist } from '../vec3';
import { ANALOGY_PRESETS, EMBEDDING_WORDS } from '@/data/embeddings';
import { EMBEDDING_TOUR } from '@/scenes/EmbeddingSpace/store';

describe('эмбеддинги', () => {
  it('король − мужчина + женщина ≈ королева', () => {
    const r = analogy(EMBEDDING_WORDS, 'король', 'мужчина', 'женщина');
    expect(r.neighbors[0].word.id).toBe('королева');
  });
  it('Париж − Франция + Италия ≈ Рим', () => {
    const r = analogy(EMBEDDING_WORDS, 'париж', 'франция', 'италия');
    expect(r.neighbors[0].word.id).toBe('рим');
  });
  it('соседи кошки — животные', () => {
    const n = nearestWords(EMBEDDING_WORDS, 'кошка', 5);
    expect(n.every((x) => x.word.cluster === 'animals')).toBe(true);
  });
  it('у каждого слова все пять соседей — из его кластера', () => {
    for (const w of EMBEDDING_WORDS) {
      const n = nearestWords(EMBEDDING_WORDS, w.id, 5);
      expect(n.every((x) => x.word.cluster === w.cluster), w.word).toBe(true);
    }
  });
  it('столица − страна + страна ≈ столица для всех пар', () => {
    const pairs = [['россия', 'москва'], ['франция', 'париж'], ['германия', 'берлин'], ['италия', 'рим'], ['япония', 'токио']];
    for (const [c1, cap1] of pairs) for (const [c2, cap2] of pairs) {
      if (c1 === c2) continue;
      expect(analogy(EMBEDDING_WORDS, cap1, c1, c2, 1).neighbors[0].word.id, `${cap1} − ${c1} + ${c2}`).toBe(cap2);
    }
  });
  it('точки не слипаются, а id пресетов и экскурсии существуют', () => {
    for (let i = 0; i < EMBEDDING_WORDS.length; i++)
      for (let j = i + 1; j < EMBEDDING_WORDS.length; j++) expect(dist(EMBEDDING_WORDS[i].pos, EMBEDDING_WORDS[j].pos)).toBeGreaterThan(0.4);
    const ids = new Set(EMBEDDING_WORDS.map((w) => w.id));
    expect(ids.size).toBe(EMBEDDING_WORDS.length);
    for (const p of ANALOGY_PRESETS) for (const id of [p.a, p.b, p.c]) expect(ids.has(id), id).toBe(true);
    for (const s of EMBEDDING_TOUR) for (const id of [s.select, s.params?.a, s.params?.b, s.params?.c]) if (typeof id === 'string') expect(ids.has(id), id).toBe(true);
  });
  it('неизвестное слово в аналогии не роняет расчёт', () => {
    expect(analogy(EMBEDDING_WORDS, 'дракон', 'мужчина', 'женщина').neighbors).toEqual([]);
  });
});

describe('самое далёкое слово', () => {
  it('лежит в другом кластере и даёт отрицательный косинус', () => {
    const cat = EMBEDDING_WORDS.find((w) => w.id === 'кошка')!;
    const far = farthestWord(EMBEDDING_WORDS, 'кошка')!;
    expect(far.word.cluster).not.toBe(cat.cluster);
    expect(far.cos).toBeLessThan(0);
    for (const n of nearestWords(EMBEDDING_WORDS, 'кошка', 5)) {
      expect(n.cos).toBeGreaterThan(far.cos);
    }
  });

  it('для несуществующего слова возвращает null', () => {
    expect(farthestWord(EMBEDDING_WORDS, 'дракон')).toBeNull();
  });
});

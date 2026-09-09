import { describe, expect, it } from 'vitest';
import { analogy, farthestWord, nearestWords } from '../embeddings';
import { EMBEDDING_WORDS } from '@/data/embeddings';

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

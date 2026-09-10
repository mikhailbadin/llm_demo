import { add, cos3, dist, sub, type Vec3 } from './vec3';

export interface EmbeddingWord {
  id: string;
  word: string;
  cluster: string;
  pos: Vec3;
}

export interface Neighbor {
  word: EmbeddingWord;
  cos: number;
  /** евклидово расстояние до точки-запроса (заполняется для аналогий) */
  dist?: number;
}

export function nearestTo(words: readonly EmbeddingWord[], target: Vec3, k: number, exclude: readonly string[] = []): Neighbor[] {
  const ex = new Set(exclude);
  return words
    .filter((w) => !ex.has(w.id))
    .map((w) => ({ word: w, cos: cos3(w.pos, target) }))
    .sort((a, b) => b.cos - a.cos)
    .slice(0, k);
}

export function nearestWords(words: readonly EmbeddingWord[], id: string, k: number): Neighbor[] {
  const w = words.find((x) => x.id === id);
  if (!w) return [];
  return nearestTo(words, w.pos, k, [id]);
}

/** Самое далёкое слово по косинусу — нужно, чтобы было видно шкалу: внутри группы близость ≈ 1, а между группами уходит в минус. */
export function farthestWord(words: readonly EmbeddingWord[], id: string): Neighbor | null {
  const w = words.find((x) => x.id === id);
  if (!w) return null;
  return words
    .filter((x) => x.id !== id)
    .map((x) => ({ word: x, cos: cos3(x.pos, w.pos) }))
    .sort((a, b) => a.cos - b.cos)[0] ?? null;
}

/**
 * a − b + c → ближайшие слова к результату (кроме a, b, c).
 * Ранжируем по евклидову расстоянию: точка-результат лежит внутри кластера, а там все косинусы ≈ 1,
 * и порядок по косинусу решала бы случайная погрешность. Косинус тоже возвращаем — для подписи.
 * Неизвестный id → пустой результат, а не исключение.
 */
export function analogy(words: readonly EmbeddingWord[], a: string, b: string, c: string, k = 3): { target: Vec3; neighbors: Neighbor[] } {
  const A = words.find((x) => x.id === a);
  const B = words.find((x) => x.id === b);
  const C = words.find((x) => x.id === c);
  if (!A || !B || !C) return { target: [0, 0, 0], neighbors: [] };
  const target = add(sub(A.pos, B.pos), C.pos);
  const ex = new Set([a, b, c]);
  const neighbors = words
    .filter((w) => !ex.has(w.id))
    .map((w) => ({ word: w, cos: cos3(w.pos, target), dist: dist(w.pos, target) }))
    .sort((x, y) => x.dist - y.dist)
    .slice(0, k);
  return { target, neighbors };
}

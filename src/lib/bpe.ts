export const EOW = '▁';

export interface BpeWord {
  word: string;
  count: number;
  symbols: string[];
}

export interface BpeStep {
  index: number;
  pair: [string, string];
  count: number;
  newToken: string;
  words: BpeWord[];
  vocabSize: number;
}

export interface BpeModel {
  merges: [string, string][];
  baseVocab: string[];
  vocab: string[];
  steps: BpeStep[];
  initialWords: BpeWord[];
}

export interface Token {
  text: string;
  id: number;
}

const WORD_RE = /[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu;

export function splitWords(text: string): string[] {
  return text.match(WORD_RE) ?? [];
}

function toSymbols(word: string): string[] {
  const chars = [...word];
  if (chars.length === 0) return [];
  chars[chars.length - 1] = chars[chars.length - 1] + EOW;
  return chars;
}

function countPairs(words: readonly BpeWord[]): Map<string, { pair: [string, string]; count: number }> {
  const pairs = new Map<string, { pair: [string, string]; count: number }>();
  for (const w of words) {
    for (let i = 0; i < w.symbols.length - 1; i++) {
      const key = `${w.symbols[i]} ${w.symbols[i + 1]}`;
      const e = pairs.get(key);
      if (e) e.count += w.count;
      else pairs.set(key, { pair: [w.symbols[i], w.symbols[i + 1]], count: w.count });
    }
  }
  return pairs;
}

function mergeSymbols(symbols: readonly string[], pair: [string, string]): string[] {
  const out: string[] = [];
  for (let i = 0; i < symbols.length; i++) {
    if (i < symbols.length - 1 && symbols[i] === pair[0] && symbols[i + 1] === pair[1]) {
      out.push(pair[0] + pair[1]);
      i++;
    } else out.push(symbols[i]);
  }
  return out;
}

/** Обучает BPE на корпусе «слово → частота», сохраняя состояние после каждого слияния. */
export function learnBpe(corpus: Record<string, number>, numMerges: number): BpeModel {
  let words: BpeWord[] = Object.entries(corpus).map(([word, count]) => ({ word, count, symbols: toSymbols(word.toLowerCase()) }));
  const initialWords = words.map((w) => ({ ...w, symbols: [...w.symbols] }));
  const base = new Set<string>();
  for (const w of words) for (const s of w.symbols) base.add(s);
  const baseVocab = [...base].sort();
  const vocab = [...baseVocab];
  const merges: [string, string][] = [];
  const steps: BpeStep[] = [];

  for (let k = 0; k < numMerges; k++) {
    const pairs = countPairs(words);
    if (pairs.size === 0) break;
    let best: { pair: [string, string]; count: number } | null = null;
    for (const e of pairs.values()) {
      if (!best || e.count > best.count || (e.count === best.count && e.pair.join('') < best.pair.join(''))) best = e;
    }
    if (!best || best.count < 2) break;
    const pair = best.pair;
    const newToken = pair[0] + pair[1];
    words = words.map((w) => ({ ...w, symbols: mergeSymbols(w.symbols, pair) }));
    merges.push(pair);
    vocab.push(newToken);
    steps.push({ index: k, pair, count: best.count, newToken, words: words.map((w) => ({ ...w, symbols: [...w.symbols] })), vocabSize: vocab.length });
  }
  return { merges, baseVocab, vocab, steps, initialWords };
}

/** Токенизирует текст первыми `numMerges` слияниями (по умолчанию всеми). */
export function tokenizeBpe(text: string, model: BpeModel, numMerges?: number): Token[] {
  const merges = numMerges === undefined ? model.merges : model.merges.slice(0, numMerges);
  const index = new Map(model.vocab.map((t, i) => [t, i] as const));
  const out: Token[] = [];
  for (const word of splitWords(text)) {
    let symbols = toSymbols(word.toLowerCase());
    for (const m of merges) symbols = mergeSymbols(symbols, m);
    for (const s of symbols) out.push({ text: s, id: index.get(s) ?? -1 });
  }
  return out;
}

export function tokenizeChars(text: string): Token[] {
  return [...text].map((ch) => ({ text: ch, id: ch.codePointAt(0) ?? 0 }));
}

function hashId(s: string): number {
  let h = 2166136261;
  for (const ch of s) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 50000;
}

export function tokenizeWords(text: string): Token[] {
  return splitWords(text).map((w) => ({ text: w, id: hashId(w.toLowerCase()) }));
}

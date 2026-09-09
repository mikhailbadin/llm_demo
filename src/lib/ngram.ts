import type { Rng } from './rng';
import { transformDistribution, sampleIndex, greedyIndex, type Candidate, type SamplingOptions, DEFAULT_SAMPLING } from './sampling';

export const BOS = '<s>';
export const EOS = '</s>';

type Counts = Map<string, number>;
type ContextCounts = Map<string, Counts>;

export interface NgramModel {
  vocab: string[];
  uni: Counts;
  bi: ContextCounts;
  tri: ContextCounts;
  total: number;
  sentences: number;
}

const WORD_RE = /[а-яё]+|[a-z]+|\d+|[.,!?;:—–-]/gi;

/** Разбивает текст на слова (в нижнем регистре) и знаки препинания. */
export function tokenizeText(text: string): string[] {
  return text.toLowerCase().match(WORD_RE) ?? [];
}

/** Собирает токены обратно в текст, приклеивая знаки препинания. */
export function detokenize(tokens: readonly string[]): string {
  let out = '';
  for (const t of tokens) {
    if (t === BOS || t === EOS) continue;
    if (/^[.,!?;:]$/.test(t)) out += t;
    else out += (out ? ' ' : '') + t;
  }
  return out;
}

/** Ставит точку в конце фразы, если знака конца предложения ещё нет. */
export function endSentence(text: string): string {
  const t = text.trimEnd();
  return /[.!?…]$/.test(t) ? t : `${t}.`;
}

function inc(map: Counts, key: string, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by);
}
function incCtx(map: ContextCounts, ctx: string, key: string) {
  let m = map.get(ctx);
  if (!m) {
    m = new Map();
    map.set(ctx, m);
  }
  inc(m, key);
}

export function trainNgram(sentences: readonly string[]): NgramModel {
  const uni: Counts = new Map();
  const bi: ContextCounts = new Map();
  const tri: ContextCounts = new Map();
  let total = 0;
  for (const s of sentences) {
    const toks = [BOS, BOS, ...tokenizeText(s), EOS];
    for (let i = 2; i < toks.length; i++) {
      const w = toks[i];
      inc(uni, w);
      total++;
      incCtx(bi, toks[i - 1], w);
      incCtx(tri, `${toks[i - 2]} ${toks[i - 1]}`, w);
    }
  }
  const vocab = [...uni.keys()].sort();
  return { vocab, uni, bi, tri, total, sentences: sentences.length };
}

const ALPHA = 0.02;
const LAMBDA = { uni: 0.1, bi: 0.3, tri: 0.6 };

/** Контекст → распределение по всему словарю (сумма = 1), отсортировано по убыванию. */
export function nextDistribution(model: NgramModel, context: readonly string[]): Candidate[] {
  const ctx = [BOS, BOS, ...context.map((t) => t.toLowerCase())];
  const w1 = ctx[ctx.length - 1];
  const w2 = ctx[ctx.length - 2];
  const biCounts = model.bi.get(w1);
  const triCounts = model.tri.get(`${w2} ${w1}`);
  const biTotal = biCounts ? [...biCounts.values()].reduce((a, b) => a + b, 0) : 0;
  const triTotal = triCounts ? [...triCounts.values()].reduce((a, b) => a + b, 0) : 0;
  const V = model.vocab.length;
  let lu = LAMBDA.uni;
  let lb = biCounts ? LAMBDA.bi : 0;
  let lt = triCounts ? LAMBDA.tri : 0;
  const ls = lu + lb + lt;
  lu /= ls;
  lb /= ls;
  lt /= ls;
  const out: Candidate[] = model.vocab.map((w) => {
    const pu = ((model.uni.get(w) ?? 0) + ALPHA) / (model.total + ALPHA * V);
    const pb = biCounts && biTotal ? (biCounts.get(w) ?? 0) / biTotal : 0;
    const pt = triCounts && triTotal ? (triCounts.get(w) ?? 0) / triTotal : 0;
    return { token: w, p: lu * pu + lb * pb + lt * pt };
  });
  out.sort((a, b) => b.p - a.p);
  return out;
}

/** Сколько раз каждое слово встречалось после данного контекста (для виджета «обучение по счётчикам»). */
export function contextCounts(model: NgramModel, context: readonly string[]): { token: string; count: number }[] {
  const ctx = context.map((t) => t.toLowerCase());
  let counts: Counts | undefined;
  if (ctx.length >= 2) counts = model.tri.get(`${ctx[ctx.length - 2]} ${ctx[ctx.length - 1]}`);
  if (!counts && ctx.length >= 1) counts = model.bi.get(ctx[ctx.length - 1]);
  if (!counts) return [];
  return [...counts.entries()].map(([token, count]) => ({ token, count })).sort((a, b) => b.count - a.count);
}

export interface GenerateOptions extends SamplingOptions {
  greedy?: boolean;
}

/** Генерирует до `steps` новых токенов (останавливается на конце предложения). */
export function generate(model: NgramModel, prefix: readonly string[], steps: number, rng: Rng, opts: GenerateOptions = DEFAULT_SAMPLING): string[] {
  const out: string[] = [];
  const seq = [...prefix];
  for (let i = 0; i < steps; i++) {
    const dist = nextDistribution(model, seq);
    const rows = transformDistribution(dist, opts);
    const probs = rows.map((r) => r.pFinal);
    const idx = opts.greedy ? greedyIndex(probs) : sampleIndex(probs, rng);
    const tok = rows[idx].token;
    if (tok === EOS) break;
    out.push(tok);
    seq.push(tok);
  }
  return out;
}

/** Средний −log p по токенам предложения (cross-entropy на одном примере). */
export function scoreSentence(model: NgramModel, sentence: string): number {
  const toks = [...tokenizeText(sentence), EOS];
  let loss = 0;
  const seq: string[] = [];
  for (const t of toks) {
    const dist = nextDistribution(model, seq);
    const p = dist.find((c) => c.token === t)?.p ?? 1e-6;
    loss += -Math.log(p);
    seq.push(t);
  }
  return loss / toks.length;
}

export function displayToken(t: string): string {
  if (t === EOS) return '⏎';
  if (t === BOS) return '⟨начало⟩';
  return t;
}

import { useMemo, useState } from 'react';
import { Button, Select, WidgetFrame } from '@/components/ui';
import { NGRAM_MODEL } from '@/data/model';
import { SAMPLING_PREFIXES } from '@/data/corpus';
import { detokenize, generate, tokenizeText } from '@/lib/ngram';
import { createRng } from '@/lib/rng';

/** Точка — обычный токен словаря, и сэмплирование может продолжить фразу после неё.
 *  Здесь сравниваются законченные предложения, поэтому обрезаем по первой точке. */
function untilPeriod(tokens: string[]): string[] {
  const i = tokens.indexOf('.');
  return i >= 0 ? tokens.slice(0, i + 1) : tokens;
}

export function GreedyVsSampling() {
  const [prefix, setPrefix] = useState('дети играют');
  const [seed, setSeed] = useState(1);
  const tokens = useMemo(() => tokenizeText(prefix), [prefix]);
  const greedy = useMemo(() => untilPeriod(generate(NGRAM_MODEL, tokens, 14, createRng(0), { temperature: 1, topK: null, topP: null, greedy: true })), [tokens]);
  const samples = useMemo(() => [0, 1, 2].map((i) => untilPeriod(generate(NGRAM_MODEL, tokens, 14, createRng(seed * 100 + i), { temperature: 0.9, topK: null, topP: null }))), [tokens, seed]);
  return (
    <WidgetFrame
      title="Жадно или случайно?"
      icon="⚖️"
      help="Слева — жадное продолжение: на каждом шаге берётся самый вероятный токен, результат всегда один. Справа — три случайных продолжения при T = 0,9. «Ещё раз» меняет seed."
      note="Жадная генерация детерминирована и склонна к однообразию и повторам. Сэмплирование даёт разнообразие, но иногда уводит в странные места. Настоящие чат-модели обычно сэмплируют с T ≈ 0,7–1 и top-p ≈ 0,9."
    >
      <div className="row" style={{ marginBottom: 12 }}>
        <div style={{ minWidth: 220 }}>
          <Select value={prefix} options={SAMPLING_PREFIXES} onChange={setPrefix} />
        </div>
        <Button size="sm" onClick={() => setSeed((s) => s + 1)}>
          Ещё раз
        </Button>
      </div>
      <div className="grid-2">
        <div className="card" style={{ padding: '12px 14px' }}>
          <div className="small muted">Жадно (T → 0)</div>
          <p style={{ margin: '6px 0 0' }}>
            <span className="muted">{prefix}</span> {detokenize(greedy)}
          </p>
        </div>
        <div className="card" style={{ padding: '12px 14px' }}>
          <div className="small muted">Сэмплирование (T = 0,9)</div>
          {samples.map((s, i) => (
            <p key={i} style={{ margin: '6px 0 0' }}>
              <span className="muted">{prefix}</span> {detokenize(s)}
            </p>
          ))}
        </div>
      </div>
    </WidgetFrame>
  );
}

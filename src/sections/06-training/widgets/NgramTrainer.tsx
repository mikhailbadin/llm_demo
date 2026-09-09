import { useMemo, useState } from 'react';
import { Select, Slider, WidgetFrame } from '@/components/ui';
import { BarChart, LineChart } from '@/components/charts';
import { CORPUS, HELD_OUT } from '@/data/corpus';
import { contextCounts, nextDistribution, scoreSentence, tokenizeText, trainNgram, displayToken } from '@/lib/ngram';
import { fmtFixed, fmtPct, plural } from '@/lib/format';
import { theme } from '@/styles/theme';

const CONTEXTS = [
  { value: 'кот', label: 'кот …' },
  { value: 'кот сидит на', label: 'кот сидит на …' },
  { value: 'собака', label: 'собака …' },
  { value: 'дети играют', label: 'дети играют …' },
  { value: 'в городе', label: 'в городе …' },
];
const STEP = 5;
const CURVE = Array.from({ length: CORPUS.length / STEP }, (_, i) => {
  const n = (i + 1) * STEP;
  const m = trainNgram(CORPUS.slice(0, n));
  const loss = HELD_OUT.reduce((s, x) => s + scoreSentence(m, x), 0) / HELD_OUT.length;
  return { x: n, y: loss };
});

export function NgramTrainer() {
  const [n, setN] = useState(CORPUS.length);
  const [ctx, setCtx] = useState('кот');
  const model = useMemo(() => trainNgram(CORPUS.slice(0, n)), [n]);
  const tokens = tokenizeText(ctx);
  const counts = useMemo(() => contextCounts(model, tokens).slice(0, 8), [model, tokens]);
  const dist = useMemo(() => (model.vocab.length ? nextDistribution(model, tokens).slice(0, 8) : []), [model, tokens]);
  const heldLoss = useMemo(() => (model.vocab.length ? HELD_OUT.reduce((s, x) => s + scoreSentence(model, x), 0) / HELD_OUT.length : NaN), [model]);

  return (
    <WidgetFrame
      title="Обучаем модель: считаем, что идёт после чего"
      icon="📚"
      help="Ползунок — сколько предложений корпуса модель уже «прочитала». Слева — счётчики: сколько раз каждое слово встречалось после выбранного контекста. Справа — как падает ошибка на трёх предложениях, которых модель не видела."
      onReset={() => {
        setN(CORPUS.length);
        setCtx('кот');
      }}
      note="Наша модель учится счётом, настоящая — градиентным спуском. Но цель одна: чтобы вероятность следующего слова в незнакомом тексте была как можно выше, то есть чтобы loss на проверочных данных падал."
    >
      <div className="controls">
        <Slider label="Прочитано предложений" value={n} min={STEP} max={CORPUS.length} step={STEP} onChange={setN} format={(v) => `${v} / ${CORPUS.length}`} />
        <Select label="Контекст" value={ctx} options={CONTEXTS} onChange={setCtx} />
      </div>
      <div className="grid-2">
        <div>
          <div className="small muted" style={{ marginBottom: 4 }}>
            После «{ctx}» встречалось ({plural(counts.reduce((s, c) => s + c.count, 0), ['раз', 'раза', 'раз'])})
          </div>
          {counts.length ? (
            <BarChart
              items={counts.map((c, i) => ({ label: displayToken(c.token), value: c.count, highlight: i === 0, title: `${c.count} раз → ${fmtPct(dist.find((d) => d.token === c.token)?.p ?? 0)}` }))}
              format={(v) => `${v}`}
            />
          ) : (
            <p className="muted small">Такого контекста модель ещё не видела — она распределит вероятность почти равномерно.</p>
          )}
        </div>
        <div>
          <div className="small muted" style={{ marginBottom: 4 }}>
            Средний loss на проверочных предложениях: <strong className="mono">{fmtFixed(heldLoss, 2)}</strong>
          </div>
          <LineChart series={[{ points: CURVE, color: theme.accent }]} xDomain={[0, CORPUS.length]} yDomain={[0, Math.ceil(Math.max(...CURVE.map((c) => c.y)))]} height={200} xLabel="прочитано предложений" yLabel="loss" xTicks={6} yTicks={4}>
            {({ sx, sy }) => (
              <g>
                <line x1={sx(n)} x2={sx(n)} y1={sy(0)} y2={sy(heldLoss)} stroke={theme.warn} strokeDasharray="4 3" />
                <circle cx={sx(n)} cy={sy(heldLoss)} r={6} fill={theme.warn} stroke={theme.bg} strokeWidth={2} />
              </g>
            )}
          </LineChart>
          <div className="small muted">
            Проверочные предложения: {HELD_OUT.map((h) => `«${h}»`).join(', ')}.
          </div>
        </div>
      </div>
    </WidgetFrame>
  );
}

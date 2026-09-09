import { useState } from 'react';
import { Slider, WidgetFrame } from '@/components/ui';
import { BarChart, LineChart } from '@/components/charts';
import { softmax } from '@/lib/math';
import { fmtFixed, fmtPct } from '@/lib/format';
import { theme } from '@/styles/theme';

const LABELS = ['окне', 'диване', 'крыше', 'коврике', 'столе', 'полу'];
const DEFAULT = [2.0, 1.5, 0.8, 0.3, -0.5, -1.0];

export function CrossEntropyPlayground() {
  const [z, setZ] = useState(DEFAULT);
  const [correct, setCorrect] = useState(2);
  const p = softmax(z);
  const pc = p[correct];
  const loss = -Math.log(pc);
  const curve = Array.from({ length: 60 }, (_, i) => {
    const x = 0.01 + (i / 59) * 0.99;
    return { x, y: -Math.log(x) };
  });

  return (
    <WidgetFrame
      title="Cross-entropy: цена ошибки"
      icon="🎯"
      help="Ползунки — логиты модели для шести кандидатов. Нажмите на столбик, чтобы объявить это слово «правильным ответом» из обучающего текста. Loss — минус логарифм вероятности, которую модель дала правильному слову."
      onReset={() => {
        setZ(DEFAULT);
        setCorrect(2);
      }}
      note="Кривая справа показывает, как loss зависит от p(правильный): около единицы он почти ноль, а при уверенной ошибке (p → 0) уходит в бесконечность. Модель сильнее всего наказывают за уверенные промахи."
    >
      <div className="grid-2">
        <div>
          {z.map((v, i) => (
            <Slider
              key={i}
              label={
                <span className="mono" style={{ color: i === correct ? theme.ok : undefined }}>
                  {LABELS[i]}
                  {i === correct ? ' ✓' : ''}
                </span>
              }
              value={v}
              min={-4}
              max={6}
              step={0.1}
              onChange={(x) => setZ((prev) => prev.map((y, j) => (j === i ? x : y)))}
              format={(x) => fmtFixed(x, 1)}
            />
          ))}
        </div>
        <div>
          <div className="small muted" style={{ marginBottom: 4 }}>
            Нажмите на столбик — сделать правильным ответом
          </div>
          <BarChart
            items={p.map((v, i) => ({ label: LABELS[i], value: v, color: i === correct ? theme.ok : theme.accent, highlight: i === correct }))}
            max={1}
            orientation="vertical"
            height={150}
            format={(v) => fmtPct(v, 0)}
            onClick={setCorrect}
          />
          <div className="stat-row">
            <div className="stat">
              <span className="stat__label">p(правильный)</span>
              <span className="stat__value">{fmtFixed(pc, 3)}</span>
            </div>
            <div className="stat">
              <span className="stat__label">loss = −ln p</span>
              <span className="stat__value" style={{ color: loss > 2 ? theme.danger : loss > 0.7 ? theme.warn : theme.ok }}>
                {fmtFixed(loss, 2)}
              </span>
            </div>
            <div className="stat">
              <span className="stat__label">perplexity = e^loss</span>
              <span className="stat__value">{fmtFixed(Math.exp(loss), 1)}</span>
            </div>
          </div>
        </div>
      </div>
      <LineChart series={[{ points: curve, color: theme.accent2 }]} xDomain={[0, 1]} yDomain={[0, 5]} height={170} xLabel="p(правильный токен)" yLabel="loss" xTicks={5} yTicks={5}>
        {({ sx, sy }) => (
          <g>
            <line x1={sx(pc)} x2={sx(pc)} y1={sy(0)} y2={sy(Math.min(loss, 5))} stroke={theme.ok} strokeDasharray="4 3" />
            <circle cx={sx(pc)} cy={sy(Math.min(loss, 5))} r={6} fill={theme.ok} stroke={theme.bg} strokeWidth={2} />
          </g>
        )}
      </LineChart>
    </WidgetFrame>
  );
}

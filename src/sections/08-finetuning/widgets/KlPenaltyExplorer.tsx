import { useState } from 'react';
import { Slider, WidgetFrame } from '@/components/ui';
import { LineChart } from '@/components/charts';
import { fmtFixed } from '@/lib/format';
import { theme } from '@/styles/theme';

const proxy = (d: number) => 2.4 * (1 - Math.exp(-d)) + 0.25 * d; // модель наград: растёт и растёт
const truth = (d: number) => 2.4 * (1 - Math.exp(-d)) - 0.22 * d * d; // настоящая полезность: сначала растёт, потом падает
const XS = Array.from({ length: 81 }, (_, i) => (i / 80) * 4);

export function KlPenaltyExplorer() {
  const [beta, setBeta] = useState(0.3);
  const objective = (d: number) => proxy(d) - beta * d * d;
  let best = 0;
  for (const d of XS) if (objective(d) > objective(best)) best = d;
  return (
    <WidgetFrame
      title="Поводок KL: не уходить далеко от базовой модели"
      icon="🐕"
      help="Ось X — насколько дообученная модель отошла от базовой (KL-расстояние, схематично). Фиолетовая кривая — оценка модели наград, зелёная — реальная полезность для людей. Ползунок β — сила штрафа за отход; маркер — куда сойдётся оптимизация."
      onReset={() => setBeta(0.3)}
      note="Модель наград — лишь приближение человеческих предпочтений. Если давить на неё слишком сильно (маленький β), модель находит «дырки» в оценщике: длинные, льстивые, шаблонные ответы с высокой наградой и низкой пользой. Это называется reward hacking."
    >
      <Slider label="β — штраф за отход от базовой модели" value={beta} min={0.02} max={1} step={0.02} onChange={setBeta} format={(v) => fmtFixed(v, 2)} />
      <LineChart
        series={[
          { points: XS.map((d) => ({ x: d, y: proxy(d) })), color: theme.accent2, label: 'модель наград' },
          { points: XS.map((d) => ({ x: d, y: truth(d) })), color: theme.ok, label: 'реальная польза' },
          { points: XS.map((d) => ({ x: d, y: objective(d) })), color: theme.muted, dashed: true, label: 'награда − β·KL' },
        ]}
        xDomain={[0, 4]}
        yDomain={[-1, 3.5]}
        height={240}
        xLabel="расстояние от базовой модели (KL)"
        yLabel="оценка"
        xTicks={4}
        yTicks={4}
      >
        {({ sx, sy }) => (
          <g>
            <line x1={sx(best)} x2={sx(best)} y1={sy(-1)} y2={sy(3.5)} stroke={theme.warn} strokeDasharray="4 3" />
            <circle cx={sx(best)} cy={sy(truth(best))} r={7} fill={theme.ok} stroke={theme.bg} strokeWidth={2} />
            <circle cx={sx(best)} cy={sy(proxy(best))} r={7} fill={theme.accent2} stroke={theme.bg} strokeWidth={2} />
          </g>
        )}
      </LineChart>
      <div className="row small" style={{ gap: 16, marginTop: 6 }}>
        <span style={{ color: theme.accent2 }}>■ модель наград</span>
        <span style={{ color: theme.ok }}>■ реальная польза</span>
        <span style={{ color: theme.muted }}>┄ то, что оптимизируем</span>
        <span className="muted">оптимум при KL = {fmtFixed(best, 2)}: польза {fmtFixed(truth(best), 2)}</span>
      </div>
    </WidgetFrame>
  );
}

import { useState } from 'react';
import { Slider, WidgetFrame } from '@/components/ui';
import { LineChart } from '@/components/charts';
import { fmtFixed } from '@/lib/format';
import { theme } from '@/styles/theme';

// Ось X — «отклонение» d дообученной модели от базовой. Для небольшого сдвига распределения
// KL растёт квадратично по величине сдвига, поэтому штраф считаем как β·d².
const proxy = (d: number) => 2.4 * (1 - Math.exp(-d)) + 0.25 * d; // модель наград: растёт и растёт
const truth = (d: number) => 2.4 * (1 - Math.exp(-d)) - 0.22 * d * d; // настоящая полезность: сначала растёт, потом падает
const kl = (d: number) => d * d;
const XS = Array.from({ length: 81 }, (_, i) => (i / 80) * 4);
const Y_MIN = -1.5;
const Y_MAX = 3.5;

export function KlPenaltyExplorer() {
  const [beta, setBeta] = useState(0.3);
  const objective = (d: number) => proxy(d) - beta * kl(d);
  let best = 0;
  for (const d of XS) if (objective(d) > objective(best)) best = d;
  return (
    <WidgetFrame
      title="Поводок KL: не уходить далеко от базовой модели"
      icon="🐕"
      help="Ось X — насколько дообученная модель отклонилась от базовой (схематичная величина d; KL-расстояние при таком сдвиге растёт как d²). Фиолетовая кривая — оценка модели наград, зелёная — реальная полезность для людей, пунктир — то, что оптимизирует RLHF: награда − β·KL. Ползунок β — сила штрафа; маркеры — куда сойдётся оптимизация."
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
        yDomain={[Y_MIN, Y_MAX]}
        height={240}
        xLabel="отклонение от базовой модели d (KL ≈ d²)"
        yLabel="оценка"
        xTicks={4}
        yTicks={5}
        ariaLabel="Награда, польза и цель RLHF в зависимости от отклонения от базовой модели"
      >
        {({ sx, sy }) => (
          <g>
            <line x1={sx(best)} x2={sx(best)} y1={sy(Y_MIN)} y2={sy(Y_MAX)} stroke={theme.warn} strokeDasharray="4 3" />
            <circle cx={sx(best)} cy={sy(Math.max(Y_MIN, truth(best)))} r={7} fill={theme.ok} stroke={theme.bg} strokeWidth={2} />
            <circle cx={sx(best)} cy={sy(Math.min(Y_MAX, proxy(best)))} r={7} fill={theme.accent2} stroke={theme.bg} strokeWidth={2} />
          </g>
        )}
      </LineChart>
      <div className="row small" style={{ gap: 16, marginTop: 6 }}>
        <span style={{ color: theme.accent2 }}>■ модель наград</span>
        <span style={{ color: theme.ok }}>■ реальная польза</span>
        <span style={{ color: theme.muted }}>┄ награда − β·KL (то, что оптимизируем)</span>
        <span className="muted">оптимум при d = {fmtFixed(best, 2)} (KL = {fmtFixed(kl(best), 2)}): польза {fmtFixed(truth(best), 2)}</span>
      </div>
    </WidgetFrame>
  );
}

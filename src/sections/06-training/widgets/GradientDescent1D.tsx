import { useEffect, useRef, useState } from 'react';
import { Button, Slider, WidgetFrame } from '@/components/ui';
import { LineChart } from '@/components/charts';
import { loss1d, loss1dGrad } from '@/lib/landscape';
import { fmtFixed } from '@/lib/format';
import { theme } from '@/styles/theme';

const START = 2.8;
const CURVE = Array.from({ length: 121 }, (_, i) => {
  const x = -3.2 + (i / 120) * 6.4;
  return { x, y: loss1d(x) };
});

export function GradientDescent1D() {
  // Путь и текущее значение — одно состояние: так обновление остаётся чистой функцией
  // (в строгом режиме React вызывает обновители дважды, и два setState рассинхронизировались бы).
  const [history, setHistory] = useState<number[]>([START]);
  const [lr, setLr] = useState(0.1);
  const [auto, setAuto] = useState(false);
  const w = history[history.length - 1];
  const g = loss1dGrad(w);

  const advance = (cur: number) => Math.max(-3.2, Math.min(3.2, cur - lr * loss1dGrad(cur)));
  const step = () => setHistory((h) => [...h.slice(-40), advance(h[h.length - 1])]);

  const gradRef = useRef(g);
  useEffect(() => {
    gradRef.current = g;
  }, [g]);

  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => {
      if (Math.abs(gradRef.current) < 1e-3) {
        setAuto(false);
        return;
      }
      setHistory((h) => [...h.slice(-40), advance(h[h.length - 1])]);
    }, 280);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, lr]);

  const reset = (start = START) => {
    setAuto(false);
    setHistory([start]);
  };
  const resetAll = () => {
    reset();
    setLr(0.1);
  };

  return (
    <WidgetFrame
      title="Градиентный спуск по одному параметру"
      icon="⛰️"
      help="Кривая — потери как функция одного параметра w. Шарик — текущее значение. Каждый «Шаг» сдвигает его против производной. Меняйте скорость обучения: при маленькой спуск медленный, при большой шарик перепрыгивает минимум."
      onReset={resetAll}
      note="Обратите внимание: из стартовой точки шарик скатывается в ближнюю, но не самую глубокую яму. Попробуйте стартовать слева (кнопка) или увеличить скорость обучения так, чтобы перескочить горб."
    >
      <div className="controls">
        <Slider label="Скорость обучения η" value={lr} min={0.01} max={1.2} step={0.01} onChange={setLr} format={(v) => fmtFixed(v, 2)} />
        <div className="btn-row" style={{ alignSelf: 'end' }}>
          <Button size="sm" variant="primary" onClick={step} disabled={auto}>
            Шаг
          </Button>
          <Button size="sm" onClick={() => setAuto((a) => !a)}>
            {auto ? '⏸ Стоп' : '▶ Авто'}
          </Button>
          <Button size="sm" onClick={() => reset(-3)}>
            Старт слева
          </Button>
        </div>
      </div>
      <LineChart series={[{ points: CURVE, color: theme.accent2 }]} xDomain={[-3.2, 3.2]} yDomain={[0, 6]} height={230} xLabel="параметр w" yLabel="loss(w)" xTicks={8} yTicks={6}>
        {({ sx, sy, plot }) => {
          const y = loss1d(w);
          const x0 = w - 0.8;
          const x1 = w + 0.8;
          return (
            <g clipPath="url(#gd-clip)">
              <defs>
                <clipPath id="gd-clip">
                  <rect x={plot.x0} y={plot.y1} width={plot.x1 - plot.x0} height={plot.y0 - plot.y1} />
                </clipPath>
              </defs>
              {history.slice(0, -1).map((h, i) => (
                <circle key={i} cx={sx(h)} cy={sy(loss1d(h))} r={3} fill={theme.muted2} opacity={0.3 + (0.7 * i) / history.length} />
              ))}
              <line x1={sx(x0)} y1={sy(y - 0.8 * g)} x2={sx(x1)} y2={sy(y + 0.8 * g)} stroke={theme.danger} strokeWidth={1.5} strokeDasharray="5 3" />
              <line x1={sx(w)} y1={sy(y)} x2={sx(Math.max(-3.2, Math.min(3.2, w - lr * g)))} y2={sy(y)} stroke={theme.ok} strokeWidth={2} markerEnd="url(#gd-arr)" />
              <circle cx={sx(w)} cy={sy(y)} r={8} fill={theme.warn} stroke={theme.bg} strokeWidth={2} />
              <defs>
                <marker id="gd-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                  <path d="M0 0L10 5L0 10z" fill={theme.ok} />
                </marker>
              </defs>
            </g>
          );
        }}
      </LineChart>
      <div className="stat-row" style={{ marginBottom: 0 }}>
        <div className="stat">
          <span className="stat__label">w</span>
          <span className="stat__value">{fmtFixed(w, 3)}</span>
        </div>
        <div className="stat">
          <span className="stat__label">loss(w)</span>
          <span className="stat__value">{fmtFixed(loss1d(w), 3)}</span>
        </div>
        <div className="stat">
          <span className="stat__label">dL/dw</span>
          <span className="stat__value">{fmtFixed(g, 3)}</span>
        </div>
        <div className="stat">
          <span className="stat__label">следующий шаг</span>
          {/* За краем графика шарик упирается в границу: показываем и формулу, и то, где он окажется. */}
          <span className="stat__value stat__value--sm">
            w − η·dL/dw = {fmtFixed(w - lr * g, 3)}
            {Math.abs(w - lr * g) > 3.2 ? ` → упор в край ${fmtFixed(advance(w), 1)}` : ''}
          </span>
        </div>
      </div>
    </WidgetFrame>
  );
}

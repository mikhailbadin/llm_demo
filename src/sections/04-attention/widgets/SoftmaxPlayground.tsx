import { useState } from 'react';
import { Button, Slider, WidgetFrame } from '@/components/ui';
import { BarChart } from '@/components/charts';
import { softmax } from '@/lib/math';
import { fmtFixed, fmtPct } from '@/lib/format';

const LABELS = ['окне', 'диване', 'крыше', 'коврике', 'столе', 'полу'];
const DEFAULT = [2.5, 1.8, 1.0, 0.4, -0.5, -1.5];

export function SoftmaxPlayground() {
  const [z, setZ] = useState<number[]>(DEFAULT);
  const [T, setT] = useState(1);
  const p = softmax(z, T);
  const setOne = (i: number, v: number) => setZ((prev) => prev.map((x, j) => (j === i ? v : x)));

  return (
    <WidgetFrame
      title="Softmax: из любых чисел — в вероятности"
      icon="📊"
      help="Слева — шесть «сырых» оценок (логитов), их можно двигать. Справа — что получается после softmax: числа стали положительными и в сумме дают ровно 1. Ползунок температуры делит логиты перед экспонентой."
      onReset={() => {
        setZ(DEFAULT);
        setT(1);
      }}
      note="Softmax усиливает различия: экспонента растёт очень быстро, поэтому логит на 2 больше означает вероятность примерно в 7 раз выше. Отрицательные логиты — не «отрицательная вероятность», просто маленькая."
    >
      <div className="grid-2">
        <div>
          {z.map((v, i) => (
            <Slider key={i} label={<span className="mono">z{i + 1} · {LABELS[i]}</span>} value={v} min={-5} max={5} step={0.1} onChange={(x) => setOne(i, x)} format={(x) => fmtFixed(x, 1)} />
          ))}
          <div className="btn-row" style={{ marginTop: 8 }}>
            <Button size="sm" onClick={() => setZ(z.map((_, i) => (i === 0 ? 5 : 0)))}>
              Один огромный логит
            </Button>
            <Button size="sm" onClick={() => setZ(z.map(() => 1))}>
              Все одинаковые
            </Button>
          </div>
        </div>
        <div>
          <Slider label="Температура T" value={T} min={0.1} max={3} step={0.1} onChange={setT} format={(x) => fmtFixed(x, 1)} hint="(про неё — в разделе про генерацию)" />
          <BarChart items={p.map((v, i) => ({ label: LABELS[i], value: v, highlight: v === Math.max(...p) }))} max={1} orientation="vertical" height={190} format={(v) => fmtPct(v, 0)} />
          <div className="stat-row" style={{ marginBottom: 0 }}>
            <div className="stat">
              <span className="stat__label">Σ pᵢ</span>
              <span className="stat__value">{fmtFixed(p.reduce((a, b) => a + b, 0), 2)}</span>
            </div>
            <div className="stat">
              <span className="stat__label">max pᵢ</span>
              <span className="stat__value">{fmtPct(Math.max(...p), 1)}</span>
            </div>
          </div>
        </div>
      </div>
    </WidgetFrame>
  );
}

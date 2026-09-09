import { WidgetFrame } from '@/components/ui';
import { BarChart } from '@/components/charts';
import { softmax, entropy } from '@/lib/math';
import { fmtFixed, fmtPct } from '@/lib/format';

const Z = [2.2, 1.6, 1.0, 0.4, -0.3, -1.2];
const LABELS = ['окне', 'диване', 'крыше', 'коврике', 'столе', 'полу'];
const TEMPS = [0.2, 0.5, 1, 1.5, 3];

export function TemperatureStrip() {
  return (
    <WidgetFrame
      title="Одни и те же логиты при разной температуре"
      icon="🌡️"
      note="Температура не меняет порядок кандидатов — лидер остаётся лидером. Она меняет, насколько уверенно модель его выбирает. Энтропия под каждым графиком — мера «размазанности» распределения."
    >
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${TEMPS.length}, 1fr)`, gap: 8 }}>
        {TEMPS.map((T) => {
          const p = softmax(Z, T);
          return (
            <div key={T} style={{ minWidth: 0 }}>
              <div className="small" style={{ textAlign: 'center', fontWeight: 600, color: T === 1 ? 'var(--accent)' : undefined }}>
                T = {fmtFixed(T, 1)}
              </div>
              <BarChart items={p.map((v, i) => ({ label: LABELS[i].slice(0, 4), value: v, highlight: i === 0 }))} max={1} orientation="vertical" height={150} format={(v) => fmtPct(v, 0)} showValues={false} />
              <div className="small muted mono" style={{ textAlign: 'center' }}>
                max {fmtPct(p[0], 0)} · H = {fmtFixed(entropy(p), 2)}
              </div>
            </div>
          );
        })}
      </div>
    </WidgetFrame>
  );
}

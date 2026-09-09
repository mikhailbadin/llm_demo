import { useRef, useState } from 'react';
import { Button, M, WidgetFrame, CoachMark } from '@/components/ui';
import { fmtFixed } from '@/lib/format';
import { theme } from '@/styles/theme';

type V = { x: number; y: number };
const SIZE = 320;
const C = SIZE / 2;
const UNIT = 60;

const toPx = (v: V) => ({ x: C + v.x * UNIT, y: C - v.y * UNIT });

export function CosinePlayground() {
  const [a, setA] = useState<V>({ x: 2, y: 1 });
  const [b, setB] = useState<V>({ x: 1, y: 2 });
  const [drag, setDrag] = useState<'a' | 'b' | null>(null);
  const [touched, setTouched] = useState(false);
  const svg = useRef<SVGSVGElement>(null);

  const dot = a.x * b.x + a.y * b.y;
  const na = Math.hypot(a.x, a.y);
  const nb = Math.hypot(b.x, b.y);
  const cos = na && nb ? dot / (na * nb) : 0;
  const theta = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;

  const local = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * SIZE;
    const py = ((e.clientY - r.top) / r.height) * SIZE;
    const x = Math.max(-2.4, Math.min(2.4, (px - C) / UNIT));
    const y = Math.max(-2.4, Math.min(2.4, (C - py) / UNIT));
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const v = local(e);
    if (drag === 'a') setA(v);
    else setB(v);
  };
  const pa = toPx(a);
  const pb = toPx(b);
  const gaugeColor = cos > 0.5 ? theme.ok : cos < -0.5 ? theme.danger : theme.warn;

  return (
    <WidgetFrame
      title="Косинусная близость двух векторов"
      icon="📐"
      help="Перетаскивайте наконечники стрелок. Справа пересчитываются скалярное произведение, длины и косинус угла. Обратите внимание: длина стрелки на косинус не влияет, только направление."
      onReset={() => {
        setA({ x: 2, y: 1 });
        setB({ x: 1, y: 2 });
      }}
      note="У настоящих эмбеддингов сотни измерений, но формула та же: перемножить координаты попарно, сложить и поделить на длины. Косинус близок к 1 — слова похожи, к 0 — не связаны, к −1 — противоположны (на практике встречается редко)."
    >
      <div className="grid-2">
        <div>
          <svg
            ref={svg}
            className="chart"
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            style={{ maxWidth: SIZE, touchAction: 'none', cursor: drag ? 'grabbing' : 'default', userSelect: 'none' }}
            onPointerMove={onMove}
            onPointerUp={() => setDrag(null)}
            onPointerLeave={() => setDrag(null)}
            role="img"
            aria-label="Два вектора на плоскости"
          >
            {[-2, -1, 1, 2].map((k) => (
              <g key={k}>
                <line className="chart__grid" x1={C + k * UNIT} x2={C + k * UNIT} y1={0} y2={SIZE} />
                <line className="chart__grid" x1={0} x2={SIZE} y1={C + k * UNIT} y2={C + k * UNIT} />
              </g>
            ))}
            <line className="chart__axis" x1={0} x2={SIZE} y1={C} y2={C} />
            <line className="chart__axis" x1={C} x2={C} y1={0} y2={SIZE} />
            <path
              d={`M ${C + 28 * Math.cos(Math.atan2(a.y, a.x)) } ${C - 28 * Math.sin(Math.atan2(a.y, a.x))} A 28 28 0 ${Math.abs(Math.atan2(b.y, b.x) - Math.atan2(a.y, a.x)) > Math.PI ? 1 : 0} ${Math.atan2(b.y, b.x) > Math.atan2(a.y, a.x) ? 0 : 1} ${C + 28 * Math.cos(Math.atan2(b.y, b.x))} ${C - 28 * Math.sin(Math.atan2(b.y, b.x))}`}
              fill="none"
              stroke={gaugeColor}
              strokeWidth={2}
            />
            <line x1={C} y1={C} x2={pa.x} y2={pa.y} stroke={theme.accent} strokeWidth={3} strokeLinecap="round" />
            <line x1={C} y1={C} x2={pb.x} y2={pb.y} stroke={theme.accent2} strokeWidth={3} strokeLinecap="round" />
            <circle cx={pa.x} cy={pa.y} r={11} fill={theme.accent} stroke={theme.bg} strokeWidth={2} style={{ cursor: 'grab' }} onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); setDrag('a'); setTouched(true); }} />
            <circle cx={pb.x} cy={pb.y} r={11} fill={theme.accent2} stroke={theme.bg} strokeWidth={2} style={{ cursor: 'grab' }} onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); setDrag('b'); setTouched(true); }} />
            <text x={pa.x + 12} y={pa.y - 10} fill={theme.accent} fontSize={14} fontWeight={700}>a</text>
            <text x={pb.x + 12} y={pb.y - 10} fill={theme.accent2} fontSize={14} fontWeight={700}>b</text>
          </svg>
          <div className="btn-row" style={{ marginTop: 8 }}>
            <Button size="sm" onClick={() => { setA({ x: 2, y: 1 }); setB({ x: 1.6, y: 0.8 }); }}>Похожие</Button>
            <Button size="sm" onClick={() => { setA({ x: 2, y: 0 }); setB({ x: 0, y: 2 }); }}>Перпендикулярные</Button>
            <Button size="sm" onClick={() => { setA({ x: 2, y: 1 }); setB({ x: -1.5, y: -0.8 }); }}>Противоположные</Button>
            <CoachMark show={!touched}>Потяните наконечник</CoachMark>
          </div>
        </div>
        <div>
          <div className="stat-row" style={{ marginTop: 0 }}>
            <div className="stat"><span className="stat__label">a = ({fmtFixed(a.x, 1)}, {fmtFixed(a.y, 1)})</span><span className="stat__value stat__value--sm">‖a‖ = {fmtFixed(na, 2)}</span></div>
            <div className="stat"><span className="stat__label">b = ({fmtFixed(b.x, 1)}, {fmtFixed(b.y, 1)})</span><span className="stat__value stat__value--sm">‖b‖ = {fmtFixed(nb, 2)}</span></div>
            <div className="stat"><span className="stat__label">a · b</span><span className="stat__value">{fmtFixed(dot, 2)}</span></div>
            <div className="stat"><span className="stat__label">угол θ</span><span className="stat__value">{fmtFixed(theta, 0)}°</span></div>
          </div>
          <div className="card" style={{ padding: '12px 14px' }}>
            <M tex={String.raw`\cos\theta = \frac{a \cdot b}{\|a\|\,\|b\|} = \frac{${fmtFixed(dot, 2).replace(',', '.')}}{${fmtFixed(na, 2).replace(',', '.')} \cdot ${fmtFixed(nb, 2).replace(',', '.')}} = `} />
            <strong style={{ color: gaugeColor, fontSize: 20, marginLeft: 6 }}>{fmtFixed(cos, 3)}</strong>
            <div style={{ marginTop: 10, height: 10, borderRadius: 5, background: `linear-gradient(90deg, ${theme.danger}, ${theme.warn}, ${theme.ok})`, position: 'relative' }}>
              <div style={{ position: 'absolute', left: `calc(${((cos + 1) / 2) * 100}% - 7px)`, top: -3, width: 14, height: 16, borderRadius: 4, background: theme.text, border: `2px solid ${theme.bg}`, transition: 'left 0.1s' }} />
            </div>
            <div className="row row--between small muted" style={{ marginTop: 4 }}><span>−1 противоположны</span><span>0 не связаны</span><span>+1 совпадают</span></div>
          </div>
        </div>
      </div>
    </WidgetFrame>
  );
}

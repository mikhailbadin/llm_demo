import type { ReactNode } from 'react';
import { theme } from '@/styles/theme';

export interface Series {
  points: { x: number; y: number }[];
  color?: string;
  label?: string;
  dashed?: boolean;
  width?: number;
}

export interface Scales {
  sx: (x: number) => number;
  sy: (y: number) => number;
  plot: { x0: number; x1: number; y0: number; y1: number };
}

interface Props {
  series: Series[];
  xDomain?: [number, number];
  yDomain?: [number, number];
  width?: number;
  height?: number;
  xLabel?: string;
  yLabel?: string;
  xTicks?: number;
  yTicks?: number;
  formatX?: (v: number) => string;
  formatY?: (v: number) => string;
  children?: (s: Scales) => ReactNode;
  onPointerMove?: (x: number, y: number) => void;
  onClick?: (x: number, y: number) => void;
  ariaLabel?: string;
}

const fmt = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(Math.abs(v) < 1 ? 2 : 1)).replace('.', ',');

export function LineChart({
  series,
  xDomain,
  yDomain,
  width = 520,
  height = 240,
  xLabel,
  yLabel,
  xTicks = 5,
  yTicks = 4,
  formatX = fmt,
  formatY = fmt,
  children,
  onPointerMove,
  onClick,
  ariaLabel,
}: Props) {
  const all = series.flatMap((s) => s.points);
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const [xmin, xmax] = xDomain ?? [Math.min(...xs), Math.max(...xs)];
  const [ymin, ymax] = yDomain ?? [Math.min(...ys), Math.max(...ys)];
  const padL = 46;
  const padR = 12;
  const padT = 12;
  const padB = xLabel ? 40 : 28;
  const x0 = padL;
  const x1 = width - padR;
  const y0 = height - padB;
  const y1 = padT;
  const sx = (x: number) => x0 + ((x - xmin) / (xmax - xmin || 1)) * (x1 - x0);
  const sy = (y: number) => y0 - ((y - ymin) / (ymax - ymin || 1)) * (y0 - y1);
  const inv = (px: number, py: number) => ({ x: xmin + ((px - x0) / (x1 - x0)) * (xmax - xmin), y: ymin + ((y0 - py) / (y0 - y1)) * (ymax - ymin) });
  const tickVals = (a: number, b: number, n: number) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);

  const toLocal = (e: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const py = ((e.clientY - rect.top) / rect.height) * height;
    return inv(px, py);
  };

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      style={{ maxHeight: height, touchAction: 'none', cursor: onClick ? 'crosshair' : undefined }}
      onPointerMove={onPointerMove ? (e) => { const p = toLocal(e); onPointerMove(p.x, p.y); } : undefined}
      onClick={onClick ? (e) => { const p = toLocal(e); onClick(p.x, p.y); } : undefined}
    >
      {tickVals(ymin, ymax, yTicks).map((v, i) => (
        <g key={`y${i}`}>
          <line className="chart__grid" x1={x0} x2={x1} y1={sy(v)} y2={sy(v)} />
          <text x={x0 - 6} y={sy(v) + 4} textAnchor="end" fontSize={11} className="mono">
            {formatY(v)}
          </text>
        </g>
      ))}
      {tickVals(xmin, xmax, xTicks).map((v, i) => (
        <g key={`x${i}`}>
          <line className="chart__grid" x1={sx(v)} x2={sx(v)} y1={y0} y2={y1} />
          <text x={sx(v)} y={y0 + 16} textAnchor="middle" fontSize={11} className="mono">
            {formatX(v)}
          </text>
        </g>
      ))}
      <line className="chart__axis" x1={x0} x2={x1} y1={y0} y2={y0} />
      <line className="chart__axis" x1={x0} x2={x0} y1={y0} y2={y1} />
      {xLabel && (
        <text x={(x0 + x1) / 2} y={height - 6} textAnchor="middle" fontSize={12}>
          {xLabel}
        </text>
      )}
      {yLabel && (
        <text x={12} y={(y0 + y1) / 2} textAnchor="middle" fontSize={12} transform={`rotate(-90 12 ${(y0 + y1) / 2})`}>
          {yLabel}
        </text>
      )}
      {series.map((s, i) => (
        <path
          key={i}
          d={s.points.map((p, j) => `${j === 0 ? 'M' : 'L'}${sx(p.x).toFixed(1)},${sy(Math.max(ymin, Math.min(ymax, p.y))).toFixed(1)}`).join(' ')}
          fill="none"
          stroke={s.color ?? theme.accent}
          strokeWidth={s.width ?? 2}
          strokeDasharray={s.dashed ? '5 4' : undefined}
          strokeLinejoin="round"
        />
      ))}
      {children?.({ sx, sy, plot: { x0, x1, y0, y1 } })}
    </svg>
  );
}

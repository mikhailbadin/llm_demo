import { theme } from '@/styles/theme';

export interface BarItem {
  label: string;
  value: number;
  color?: string;
  muted?: boolean;
  ghost?: number;
  highlight?: boolean;
  title?: string;
}

interface Props {
  items: BarItem[];
  max?: number;
  orientation?: 'horizontal' | 'vertical';
  height?: number;
  format?: (v: number) => string;
  showValues?: boolean;
  onHover?: (i: number | null) => void;
  onClick?: (i: number) => void;
  labelWidth?: number;
  ariaLabel?: string;
}

const defaultFormat = (v: number) => (v * 100).toFixed(1).replace('.', ',') + ' %';

export function BarChart({
  items,
  max,
  orientation = 'horizontal',
  height,
  format = defaultFormat,
  showValues = true,
  onHover,
  onClick,
  labelWidth = 96,
  ariaLabel,
}: Props) {
  const m = max ?? Math.max(1e-9, ...items.map((i) => Math.max(i.value, i.ghost ?? 0)));
  const interactive = !!(onHover || onClick);

  if (orientation === 'vertical') {
    const W = 520;
    const H = height ?? 200;
    const padB = 34;
    const padT = showValues ? 18 : 6;
    const n = Math.max(items.length, 1);
    const gap = 6;
    const bw = (W - gap * (n + 1)) / n;
    const scale = (v: number) => ((H - padB - padT) * v) / m;
    return (
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} style={{ maxHeight: H }}>
        <line className="chart__axis" x1={0} x2={W} y1={H - padB + 0.5} y2={H - padB + 0.5} />
        {items.map((it, i) => {
          const x = gap + i * (bw + gap);
          const h = scale(it.value);
          const gh = it.ghost !== undefined ? scale(it.ghost) : 0;
          const fill = it.muted ? theme.border2 : (it.color ?? theme.accent);
          return (
            <g
              key={i}
              onMouseEnter={onHover ? () => onHover(i) : undefined}
              onMouseLeave={onHover ? () => onHover(null) : undefined}
              onClick={onClick ? () => onClick(i) : undefined}
              style={interactive ? { cursor: 'pointer' } : undefined}
            >
              {it.title && <title>{it.title}</title>}
              {it.ghost !== undefined && (
                <rect className="bar-anim" x={x} y={H - padB - gh} width={bw} height={gh} fill="none" stroke={theme.muted2} strokeDasharray="3 3" rx={3} />
              )}
              <rect className="bar-anim" x={x} y={H - padB - h} width={bw} height={Math.max(h, 0)} fill={fill} rx={3} opacity={it.muted ? 0.6 : 1} stroke={it.highlight ? theme.text : 'none'} strokeWidth={1.5} />
              {showValues && (
                <text x={x + bw / 2} y={H - padB - h - 5} textAnchor="middle" fontSize={11} className={it.highlight ? 'chart__label--strong' : ''}>
                  {format(it.value)}
                </text>
              )}
              <text x={x + bw / 2} y={H - padB + 15} textAnchor="middle" fontSize={bw < 34 ? 10 : 12} className={it.highlight ? 'chart__label--strong' : ''}>
                {it.label.length > 9 && bw < 60 ? it.label.slice(0, 8) + '…' : it.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  const rowH = 24;
  const W = 520;
  const H = items.length * rowH + 4;
  const valW = showValues ? 64 : 8;
  const barW = W - labelWidth - valW - 8;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} style={{ maxHeight: H }}>
      {items.map((it, i) => {
        const y = i * rowH + 2;
        const w = (barW * it.value) / m;
        const gw = it.ghost !== undefined ? (barW * it.ghost) / m : 0;
        const fill = it.muted ? theme.border2 : (it.color ?? theme.accent);
        return (
          <g
            key={i}
            onMouseEnter={onHover ? () => onHover(i) : undefined}
            onMouseLeave={onHover ? () => onHover(null) : undefined}
            onClick={onClick ? () => onClick(i) : undefined}
            style={interactive ? { cursor: 'pointer' } : undefined}
          >
            {it.title && <title>{it.title}</title>}
            {it.highlight && <rect x={0} y={y - 1} width={W} height={rowH - 2} fill={theme.accent} opacity={0.08} rx={4} />}
            <text x={labelWidth - 8} y={y + rowH / 2 + 4} textAnchor="end" fontSize={13} className={it.highlight ? 'chart__label--strong' : ''} fontFamily="var(--mono)">
              {it.label.length > 12 ? it.label.slice(0, 11) + '…' : it.label}
            </text>
            {it.ghost !== undefined && (
              <rect className="bar-anim" x={labelWidth} y={y + 4} width={Math.max(gw, 0)} height={rowH - 10} fill="none" stroke={theme.muted2} strokeDasharray="3 3" rx={3} />
            )}
            <rect className="bar-anim" x={labelWidth} y={y + 4} width={Math.max(w, 0)} height={rowH - 10} fill={fill} rx={3} opacity={it.muted ? 0.5 : 1} />
            {showValues && (
              <text x={labelWidth + Math.max(w, 0) + 6} y={y + rowH / 2 + 4} fontSize={12} className="mono">
                {format(it.value)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

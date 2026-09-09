import { heatColor, theme } from '@/styles/theme';

interface Props {
  matrix: (number | null)[][];
  rowLabels: string[];
  colLabels: string[];
  cell?: number;
  colorScale?: (v: number) => string;
  format?: (v: number) => string;
  onHoverCell?: (r: number | null, c: number | null) => void;
  onClickRow?: (r: number) => void;
  activeRow?: number | null;
  showValues?: boolean;
  rowTitle?: string;
  colTitle?: string;
  labelSize?: number;
}

export function Heatmap({
  matrix,
  rowLabels,
  colLabels,
  cell = 38,
  colorScale = heatColor,
  format = (v) => v.toFixed(2).replace('.', ','),
  onHoverCell,
  onClickRow,
  activeRow = null,
  showValues = true,
  rowTitle,
  colTitle,
  labelSize = 70,
}: Props) {
  const rows = matrix.length;
  const cols = colLabels.length;
  const padL = labelSize;
  const padT = colTitle ? labelSize + 16 : labelSize;
  const W = padL + cols * cell + 4;
  const H = padT + rows * cell + 4;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Тепловая карта" style={{ maxHeight: H + 8 }}>
      {colTitle && (
        <text x={padL + (cols * cell) / 2} y={12} textAnchor="middle" fontSize={11} className="muted">
          {colTitle}
        </text>
      )}
      {rowTitle && (
        <text x={10} y={padT + (rows * cell) / 2} textAnchor="middle" fontSize={11} transform={`rotate(-90 10 ${padT + (rows * cell) / 2})`}>
          {rowTitle}
        </text>
      )}
      {colLabels.map((c, j) => (
        <text
          key={j}
          x={padL + j * cell + cell / 2}
          y={padT - 8}
          textAnchor="start"
          fontSize={12}
          transform={`rotate(-40 ${padL + j * cell + cell / 2} ${padT - 8})`}
          fontFamily="var(--mono)"
        >
          {c}
        </text>
      ))}
      {matrix.map((row, i) => (
        <g
          key={i}
          onClick={onClickRow ? () => onClickRow(i) : undefined}
          style={onClickRow ? { cursor: 'pointer' } : undefined}
        >
          {activeRow === i && <rect x={2} y={padT + i * cell} width={W - 4} height={cell} fill="none" stroke={theme.accent} strokeWidth={2} rx={4} />}
          <text
            x={padL - 8}
            y={padT + i * cell + cell / 2 + 4}
            textAnchor="end"
            fontSize={12}
            fontFamily="var(--mono)"
            className={activeRow === i ? 'chart__label--strong' : ''}
          >
            {row.length ? rowLabels[i] : ''}
          </text>
          {row.map((v, j) => {
            const x = padL + j * cell;
            const y = padT + i * cell;
            const masked = v === null;
            return (
              <g
                key={j}
                onMouseEnter={onHoverCell ? () => onHoverCell(i, j) : undefined}
                onMouseLeave={onHoverCell ? () => onHoverCell(null, null) : undefined}
              >
                <rect
                  x={x + 1}
                  y={y + 1}
                  width={cell - 2}
                  height={cell - 2}
                  rx={4}
                  fill={masked ? theme.bg2 : colorScale(v)}
                  stroke={masked ? theme.border : 'none'}
                  strokeDasharray={masked ? '3 3' : undefined}
                  style={{ transition: 'fill 0.3s' }}
                />
                {showValues && !masked && (
                  <text x={x + cell / 2} y={y + cell / 2 + 4} textAnchor="middle" fontSize={cell < 34 ? 9 : 11} fill={v > 0.55 ? '#0b0f19' : theme.text} fontFamily="var(--mono)">
                    {format(v)}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

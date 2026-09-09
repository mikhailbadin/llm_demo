import { useMemo, useState } from 'react';
import { Slider, WidgetFrame } from '@/components/ui';
import { peMatrix } from '@/lib/positional';
import { fmtFixed } from '@/lib/format';
import { mixHex, theme } from '@/styles/theme';

const POSITIONS = 32;

function color(v: number) {
  return v >= 0 ? mixHex('#141b2b', theme.accent, v) : mixHex('#141b2b', theme.danger, -v);
}

export function PositionalEncodingHeatmap() {
  const [d, setD] = useState(32);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const m = useMemo(() => peMatrix(POSITIONS, d), [d]);
  const cell = Math.max(8, Math.min(16, 480 / d));
  return (
    <WidgetFrame
      title="Позиционное кодирование"
      icon="📍"
      help="Строка — позиция токена (0…31), столбец — измерение вектора. Синусы и косинусы с разной частотой дают каждой позиции уникальный «штрих-код». Наведите на ячейку, чтобы увидеть значение и формулу."
      onReset={() => setD(32)}
      note="Левые измерения меняются быстро (различают соседние позиции), правые — медленно (различают далёкие). Похоже на двоичный счётчик, только гладкий. Такой вектор прибавляют к эмбеддингу токена перед первым блоком."
    >
      <Slider label="Размерность d" value={d} min={8} max={64} step={8} onChange={setD} />
      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <svg className="chart" viewBox={`0 0 ${d * cell + 40} ${POSITIONS * cell + 24}`} style={{ maxWidth: d * cell + 40 }} role="img" aria-label="Матрица позиционного кодирования">
          <text x={40 + (d * cell) / 2} y={12} textAnchor="middle" fontSize={11}>
            измерение i →
          </text>
          {m.map((row, pos) => (
            <g key={pos}>
              {pos % 4 === 0 && (
                <text x={34} y={24 + pos * cell + cell / 2 + 4} textAnchor="end" fontSize={10} className="mono">
                  {pos}
                </text>
              )}
              {row.map((v, i) => (
                <rect
                  key={i}
                  x={40 + i * cell}
                  y={24 + pos * cell}
                  width={cell - 1}
                  height={cell - 1}
                  fill={color(v)}
                  stroke={hover && hover[0] === pos && hover[1] === i ? theme.text : 'none'}
                  onMouseEnter={() => setHover([pos, i])}
                  onMouseLeave={() => setHover(null)}
                />
              ))}
            </g>
          ))}
        </svg>
      </div>
      <div className="card" style={{ marginTop: 10, padding: '10px 14px', fontSize: 14 }}>
        {hover ? (
          <>
            Позиция {hover[0]}, измерение {hover[1]}: {hover[1] % 2 === 0 ? 'sin' : 'cos'}(
            {hover[0]} / 10000<sup>{2 * Math.floor(hover[1] / 2)}/{d}</sup>) = <strong className="mono">{fmtFixed(m[hover[0]][hover[1]], 3)}</strong>
          </>
        ) : (
          <span className="muted">Наведите на ячейку. Бирюзовый — положительные значения, красный — отрицательные.</span>
        )}
      </div>
    </WidgetFrame>
  );
}

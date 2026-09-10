import { theme } from '@/styles/theme';

/** Статичная схема многоголового внимания. */
export function MultiHeadFigure() {
  const heads = 4;
  const box = (x: number, y: number, w: number, h: number, label: string, color: string, sub?: string) => (
    <g key={label + x}>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={theme.surface} stroke={color} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + h / 2 + (sub ? -2 : 4)} textAnchor="middle" fontSize={12} fill={theme.text} fontWeight={600}>
        {label}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 13} textAnchor="middle" fontSize={10} fill={theme.muted}>
          {sub}
        </text>
      )}
    </g>
  );
  return (
    <figure style={{ margin: '16px 0 24px' }}>
      <svg className="chart" viewBox="0 0 620 224" role="img" aria-label="Схема многоголового внимания" style={{ maxHeight: 234 }}>
        <defs>
          <marker id="mh-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0L10 5L0 10z" fill={theme.muted2} />
          </marker>
        </defs>
        {box(10, 80, 90, 50, 'X', theme.accent, 'векторы токенов')}
        {Array.from({ length: heads }, (_, i) => {
          const y = 12 + i * 48;
          return (
            <g key={i}>
              <line x1={100} y1={105} x2={158} y2={y + 20} stroke={theme.muted2} strokeWidth={1.2} markerEnd="url(#mh-arr)" />
              {box(158, y, 88, 40, `W_Q W_K W_V`, theme.accent2, `голова ${i + 1}`)}
              <line x1={246} y1={y + 20} x2={268} y2={y + 20} stroke={theme.muted2} strokeWidth={1.2} markerEnd="url(#mh-arr)" />
              {box(270, y, 110, 40, 'Внимание', theme.warn, `d/${heads} измерений`)}
              <line x1={380} y1={y + 20} x2={418} y2={95 + i * 6} stroke={theme.muted2} strokeWidth={1.2} markerEnd="url(#mh-arr)" />
            </g>
          );
        })}
        {box(420, 80, 80, 50, 'Склеить', theme.ok, 'concat')}
        <line x1={500} y1={105} x2={528} y2={105} stroke={theme.muted2} strokeWidth={1.2} markerEnd="url(#mh-arr)" />
        {box(530, 80, 80, 50, 'W_O', theme.accent, 'смешать')}
        <text x={310} y={203} textAnchor="middle" fontSize={11} fill={theme.muted}>
          Каждая голова получает свои матрицы Q, K, V и работает в своём подпространстве.
        </text>
        <text x={310} y={217} textAnchor="middle" fontSize={11} fill={theme.muted}>
          Результаты склеивают и снова проецируют матрицей W_O.
        </text>
      </svg>
    </figure>
  );
}

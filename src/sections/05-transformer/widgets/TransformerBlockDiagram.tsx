import { useEffect, useRef, useState } from 'react';
import { Button, M, WidgetFrame } from '@/components/ui';
import { theme } from '@/styles/theme';

type PartId = 'ln1' | 'attn' | 'add1' | 'ln2' | 'mlp' | 'add2' | 'res';

const PARTS: Record<PartId, { title: string; text: string; tex?: string }> = {
  res: { title: 'Остаточный поток', text: 'Вектор токена входит в блок и выходит из него, «собрав» две поправки. Благодаря обходным стрелкам градиент при обучении течёт напрямую через сотню блоков, и глубокие сети остаются обучаемыми.', tex: String.raw`x_{\text{out}} = x + \Delta_{\text{attn}} + \Delta_{\text{mlp}}` },
  ln1: { title: 'LayerNorm', text: 'Приводит числа в векторе к среднему 0 и разбросу 1 (с обучаемым масштабом). Без нормализации значения в глубоких слоях разрастаются и обучение расходится.', tex: String.raw`\operatorname{LN}(x) = \gamma \frac{x - \mu}{\sigma} + \beta` },
  attn: { title: 'Многоголовое внимание', text: 'Единственное место, где токены обмениваются информацией. Каждый токен собирает взвешенную сумму значений — своего и предыдущих токенов (см. предыдущий раздел).', tex: String.raw`\Delta_{\text{attn}} = \operatorname{MHA}(\operatorname{LN}(x))` },
  add1: { title: 'Сложение', text: 'Результат внимания не заменяет вектор, а прибавляется к нему. Так блок может «ничего не делать», если это выгодно.', tex: String.raw`x \leftarrow x + \Delta_{\text{attn}}` },
  ln2: { title: 'LayerNorm', text: 'Вторая нормализация перед MLP. В современных моделях нормализацию ставят перед операцией (pre-norm), а не после.', tex: String.raw`\operatorname{LN}(x)` },
  mlp: { title: 'MLP (полносвязная сеть)', text: 'Обрабатывает каждый токен отдельно: расширяет вектор в 4 раза (так в GPT-2; в Llama — SwiGLU с тремя матрицами и расширением ≈ 2,7d, параметров почти столько же), применяет нелинейность и сжимает обратно. Здесь хранится большая часть «знаний» модели — примерно две трети параметров блока.', tex: String.raw`\operatorname{MLP}(x) = W_2\,\operatorname{GELU}(W_1 x + b_1) + b_2` },
  add2: { title: 'Сложение', text: 'Вторая поправка прибавляется к остаточному потоку, и вектор отправляется в следующий блок.', tex: String.raw`x \leftarrow x + \Delta_{\text{mlp}}` },
};

// Вертикальная раскладка схемы (снизу вверх): LN → внимание → «+» → LN → MLP → «+».
const Y = { input: 330, ln1: 280, attn: 228, add1: 198, ln2: 138, mlp: 86, add2: 56, out: 24 };
const LN_H = 28;
const OP_H = 32;

// Путь точки-токена снизу вверх: через центр каждого элемента. Отрезок i ведёт к элементу STAGE_OF_SEG[i].
const PATH: [number, number][] = [
  [300, Y.input],
  [300, Y.ln1 + LN_H / 2],
  [300, Y.attn + OP_H / 2],
  [300, Y.add1],
  [300, Y.ln2 + LN_H / 2],
  [300, Y.mlp + OP_H / 2],
  [300, Y.add2],
  [300, Y.out],
];
const STAGE_OF_SEG: PartId[] = ['ln1', 'attn', 'add1', 'ln2', 'mlp', 'add2', 'res'];

export function TransformerBlockDiagram() {
  const [active, setActive] = useState<PartId>('res');
  const [progress, setProgress] = useState<number | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (progress === null) return;
    let last = performance.now();
    const tick = (now: number) => {
      // Отметка времени у requestAnimationFrame — начало кадра, она может оказаться
      // раньше момента запуска эффекта. Отрицательный шаг увёл бы прогресс в минус,
      // а индекс отрезка — в −1, и компонент падал бы на PATH[-1].
      const dt = Math.max(0, (now - last) / 1000);
      last = now;
      setProgress((p) => {
        if (p === null) return null;
        const np = p + dt / 3.2;
        return np >= 1 ? null : np;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress === null]);

  const dot = (() => {
    if (progress === null) return null;
    const t = progress * (PATH.length - 1);
    const i = Math.min(Math.max(Math.floor(t), 0), PATH.length - 2);
    const f = t - i;
    return { x: PATH[i][0] + (PATH[i + 1][0] - PATH[i][0]) * f, y: PATH[i][1] + (PATH[i + 1][1] - PATH[i][1]) * f, seg: i };
  })();
  const current: PartId = dot ? STAGE_OF_SEG[Math.min(dot.seg, STAGE_OF_SEG.length - 1)] : active;
  const p = PARTS[current];

  const box = (id: PartId, x: number, y: number, w: number, h: number, label: string, color: string) => {
    const on = current === id;
    return (
      <g key={id} onMouseEnter={() => setActive(id)} onClick={() => setActive(id)} style={{ cursor: 'pointer' }}>
        <rect x={x} y={y} width={w} height={h} rx={8} fill={on ? color : theme.surface} stroke={color} strokeWidth={on ? 2 : 1.2} style={{ transition: 'fill 0.2s' }} />
        <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize={12} fontWeight={600} fill={on ? theme.bg : theme.text}>
          {label}
        </text>
      </g>
    );
  };
  const plus = (id: PartId, y: number) => {
    const on = current === id;
    return (
      <g key={id} onMouseEnter={() => setActive(id)} onClick={() => setActive(id)} style={{ cursor: 'pointer' }}>
        <circle cx={300} cy={y} r={12} fill={on ? theme.ok : theme.surface} stroke={theme.ok} strokeWidth={1.5} />
        <text x={300} y={y + 5} textAnchor="middle" fontSize={15} fontWeight={700} fill={on ? theme.bg : theme.ok}>
          +
        </text>
      </g>
    );
  };

  return (
    <WidgetFrame
      title="Один блок трансформера"
      icon="🧱"
      help="Наводите курсор или нажимайте на элементы схемы — справа появится объяснение и формула. Кнопка «Прогнать токен» покажет путь вектора через блок."
      note="Снизу вверх: вектор токена входит в блок, проходит нормализацию, внимание, сложение, снова нормализацию, MLP и сложение. Две «обходные» стрелки слева — остаточные связи."
    >
      <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', alignItems: 'start' }}>
        <div>
          <svg className="chart" viewBox="120 0 360 352" role="img" aria-label="Схема блока трансформера" style={{ maxHeight: 380 }}>
            <defs>
              <marker id="tb-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0 0L10 5L0 10z" fill={theme.muted2} />
              </marker>
            </defs>
            {/* вход → LN₁ */}
            <line x1={300} y1={Y.input} x2={300} y2={Y.ln1 + LN_H + 2} stroke={theme.muted2} strokeWidth={1.5} markerEnd="url(#tb-arr)" />
            {/* остаточная связь 1: от входа в обход LN₁ и внимания — в первое сложение */}
            <path d={`M300 320 L200 320 L200 ${Y.add1} L286 ${Y.add1}`} fill="none" stroke={current === 'res' || current === 'add1' ? theme.ok : theme.muted2} strokeWidth={1.5} markerEnd="url(#tb-arr)" onMouseEnter={() => setActive('res')} />
            {/* остаточная связь 2: после первого сложения в обход LN₂ и MLP — во второе сложение */}
            <path d={`M300 ${Y.add1 - 22} L200 ${Y.add1 - 22} L200 ${Y.add2} L286 ${Y.add2}`} fill="none" stroke={current === 'res' || current === 'add2' ? theme.ok : theme.muted2} strokeWidth={1.5} markerEnd="url(#tb-arr)" onMouseEnter={() => setActive('res')} />
            <text x={196} y={252} textAnchor="end" fontSize={11} fill={theme.muted}>
              остаточные
            </text>
            <text x={196} y={266} textAnchor="end" fontSize={11} fill={theme.muted}>
              связи
            </text>
            {box('ln1', 250, Y.ln1, 100, LN_H, 'LayerNorm', theme.muted)}
            <line x1={300} y1={Y.ln1} x2={300} y2={Y.attn + OP_H + 2} stroke={theme.muted2} strokeWidth={1.5} markerEnd="url(#tb-arr)" />
            {box('attn', 240, Y.attn, 120, OP_H, 'Внимание', theme.orange)}
            <line x1={300} y1={Y.attn} x2={300} y2={Y.add1 + 14} stroke={theme.muted2} strokeWidth={1.5} markerEnd="url(#tb-arr)" />
            {plus('add1', Y.add1)}
            <line x1={300} y1={Y.add1 - 12} x2={300} y2={Y.ln2 + LN_H + 2} stroke={theme.muted2} strokeWidth={1.5} markerEnd="url(#tb-arr)" />
            {box('ln2', 250, Y.ln2, 100, LN_H, 'LayerNorm', theme.muted)}
            <line x1={300} y1={Y.ln2} x2={300} y2={Y.mlp + OP_H + 2} stroke={theme.muted2} strokeWidth={1.5} markerEnd="url(#tb-arr)" />
            {box('mlp', 240, Y.mlp, 120, OP_H, 'MLP', theme.accent2)}
            <line x1={300} y1={Y.mlp} x2={300} y2={Y.add2 + 14} stroke={theme.muted2} strokeWidth={1.5} markerEnd="url(#tb-arr)" />
            {plus('add2', Y.add2)}
            <line x1={300} y1={Y.add2 - 12} x2={300} y2={Y.out + 2} stroke={theme.muted2} strokeWidth={1.5} markerEnd="url(#tb-arr)" />
            <text x={300} y={16} textAnchor="middle" fontSize={11} fill={theme.muted}>
              в следующий блок ↑
            </text>
            <text x={300} y={346} textAnchor="middle" fontSize={11} fill={theme.muted}>
              ↑ вектор токена из предыдущего блока
            </text>
            {dot && <circle cx={dot.x} cy={dot.y} r={7} fill={theme.accent} stroke={theme.bg} strokeWidth={2} />}
          </svg>
          <Button size="sm" variant="primary" onClick={() => setProgress(0)} disabled={progress !== null}>
            {progress === null ? '▶ Прогнать токен' : 'Идёт…'}
          </Button>
        </div>
        <div className="card" style={{ padding: '12px 14px' }}>
          <div className="small muted">{dot ? 'сейчас проходит' : 'выбрано'}</div>
          <div style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 16, marginBottom: 6 }}>{p.title}</div>
          <p style={{ margin: '0 0 8px', fontSize: 14.5 }}>{p.text}</p>
          {p.tex && (
            <div className="formula" style={{ margin: 0 }}>
              <M tex={p.tex} />
            </div>
          )}
        </div>
      </div>
    </WidgetFrame>
  );
}

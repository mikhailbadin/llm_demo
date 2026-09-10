import { useMemo, useState } from 'react';
import { WidgetFrame, Toggle } from '@/components/ui';
import { Heatmap } from '@/components/charts';
import { ATTENTION_EXAMPLES } from '@/data/attentionExamples';
import { scoresToWeights } from '@/lib/attention';
import { fmtFixed } from '@/lib/format';
import { attentionStore } from '@/scenes/Attention/store';
import { AttentionControls, resetAttention } from './AttentionControls';

export function AttentionHeatmap() {
  const exampleId = attentionStore((s) => s.params.example as string);
  const head = attentionStore((s) => s.params.head as number);
  const causal = attentionStore((s) => s.params.causal as boolean);
  const selectedId = attentionStore((s) => s.selectedId);
  const example = ATTENTION_EXAMPLES.find((e) => e.id === exampleId) ?? ATTENTION_EXAMPLES[0];
  const weights = useMemo(() => scoresToWeights(example.heads[head].scores, causal), [example, head, causal]);
  // Наведение помним вместе с id примера: пример можно сменить с клавиатуры, не уводя курсор с ячейки,
  // и индексы старого примера вышли бы за границы новой матрицы.
  const [hoverState, setHover] = useState<{ ex: string; r: number; c: number } | null>(null);
  const n = example.tokens.length;
  const hover = hoverState && hoverState.ex === example.id && hoverState.r < n && hoverState.c < n ? hoverState : null;
  const selectedIdx = selectedId?.startsWith('t') ? Number(selectedId.slice(1)) : null;
  const activeRow = selectedIdx !== null && selectedIdx < n ? selectedIdx : null;
  const matrix = weights.map((row, i) => row.map((w, j) => (causal && j > i ? null : w)));

  return (
    <WidgetFrame
      title="Матрица внимания"
      icon="🔥"
      help="Строка — токен-запрос, столбец — токен-ключ, цвет — вес внимания. Каждая строка суммируется в 1. Нажмите на строку, чтобы выбрать этот запрос в 3D-сцене. Наведите на ячейку — увидите точное значение. Выбор предложения, головы и маски общий для всех виджетов раздела и 3D-сцены."
      note={example.note}
      onReset={resetAttention}
      actions={<Toggle label="Маска" checked={causal} onChange={(v) => attentionStore.getState().setParam('causal', v)} />}
    >
      <div style={{ marginBottom: 12 }}>
        <AttentionControls compact />
      </div>
      <div className="grid-2" style={{ gridTemplateColumns: '1fr auto', alignItems: 'start' }}>
        <div style={{ overflowX: 'auto' }}>
          <Heatmap
            matrix={matrix}
            rowLabels={example.tokens}
            colLabels={example.tokens}
            cell={example.tokens.length > 8 ? 34 : 40}
            activeRow={activeRow}
            onClickRow={(r) => attentionStore.getState().select(`t${r}`)}
            onHoverCell={(r, c) => setHover(r !== null && c !== null ? { ex: example.id, r, c } : null)}
            rowTitle="запрос (Query)"
            colTitle="ключ (Key)"
            showValues={example.tokens.length <= 9}
          />
        </div>
        <div className="card" style={{ minWidth: 170, padding: '10px 12px', fontSize: 14 }}>
          {hover ? (
            <>
              <div className="muted small">вес внимания</div>
              <div>
                «{example.tokens[hover.r]}» → «{example.tokens[hover.c]}»
              </div>
              <div className="stat__value" style={{ marginTop: 4 }}>
                {matrix[hover.r][hover.c] === null ? '0 (маска)' : fmtFixed(matrix[hover.r][hover.c]!, 3)}
              </div>
            </>
          ) : (
            <div className="muted small">Наведите на ячейку, чтобы увидеть вес.</div>
          )}
          <div className="small muted" style={{ marginTop: 10 }}>
            {example.heads[head].description}
          </div>
        </div>
      </div>
    </WidgetFrame>
  );
}

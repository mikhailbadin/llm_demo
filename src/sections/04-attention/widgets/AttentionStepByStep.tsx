import { useState } from 'react';
import { Stepper, TokenChips, Toggle, WidgetFrame } from '@/components/ui';
import { BarChart } from '@/components/charts';
import { ATTENTION_EXAMPLES } from '@/data/attentionExamples';
import { scoresToWeights } from '@/lib/attention';
import { createRng } from '@/lib/rng';
import { fmtFixed } from '@/lib/format';
import { attentionStore } from '@/scenes/Attention/store';
import { mixHex, theme } from '@/styles/theme';

const STAGES = [
  { title: 'Оценки: запрос × ключи', text: 'Запрос выбранного токена сравнивается с ключом каждого токена (скалярное произведение). Большая оценка — «этот токен мне важен». В настоящей модели оценки ещё делят на √d, чтобы они не были слишком большими.' },
  { title: 'Причинная маска', text: 'Если модель генерирует текст слева направо, будущих токенов ещё не существует. Их оценки заменяют на −∞, чтобы после softmax они дали ровно 0.' },
  { title: 'Softmax → веса', text: 'Оценки превращаются в веса: все положительные, сумма равна 1. Это распределение «на кого смотреть».' },
  { title: 'Взвешенная сумма значений', text: 'У каждого токена есть вектор-значение (Value). Итог для запроса — сумма значений, умноженных на веса. Токен «впитывает» содержимое тех, на кого смотрел.' },
];

const valueRng = createRng(11);
const VALUES = new Map<string, number[]>();
function valueOf(token: string): number[] {
  let v = VALUES.get(token);
  if (!v) {
    v = Array.from({ length: 4 }, () => valueRng.next());
    VALUES.set(token, v);
  }
  return v;
}

export function AttentionStepByStep() {
  const [stage, setStage] = useState(0);
  const exampleId = attentionStore((s) => s.params.example as string);
  const head = attentionStore((s) => s.params.head as number);
  const causal = attentionStore((s) => s.params.causal as boolean);
  const selectedId = attentionStore((s) => s.selectedId);
  const example = ATTENTION_EXAMPLES.find((e) => e.id === exampleId) ?? ATTENTION_EXAMPLES[0];
  const qi = selectedId?.startsWith('t') ? Math.min(Number(selectedId.slice(1)), example.tokens.length - 1) : example.focus;
  const scores = example.heads[head].scores[qi];
  const weights = scoresToWeights(example.heads[head].scores, causal)[qi];
  const masked = (j: number) => causal && j > qi;
  const output = [0, 0, 0, 0];
  example.tokens.forEach((t, j) => valueOf(t).forEach((v, k) => (output[k] += weights[j] * v)));

  const items = example.tokens.map((t, j) => {
    if (stage === 0) return { label: t, value: scores[j], title: `оценка ${fmtFixed(scores[j], 1)}` };
    if (stage === 1) return { label: t, value: masked(j) ? 0 : scores[j], muted: masked(j), title: masked(j) ? '−∞ (маска)' : `оценка ${fmtFixed(scores[j], 1)}` };
    return { label: t, value: weights[j], muted: masked(j), highlight: weights[j] === Math.max(...weights), title: `вес ${fmtFixed(weights[j], 2)}` };
  });

  return (
    <WidgetFrame
      title="Внимание по шагам"
      icon="🪜"
      help="Выберите токен-запрос (нажмите на чип) и проходите этапы кнопками. Виджет использует те же примеры и ту же голову, что и 3D-сцена ниже: выбор синхронизирован."
      onReset={() => {
        setStage(0);
        attentionStore.getState().select(`t${example.focus}`);
      }}
      note={<>{STAGES[stage].text}</>}
    >
      <div className="row row--between" style={{ marginBottom: 12 }}>
        <TokenChips tokens={example.tokens.map((t, i) => ({ text: t, color: i % 6, highlight: i === qi, muted: masked(i) }))} showIds={false} onClick={(i) => attentionStore.getState().select(`t${i}`)} />
        <Toggle label="Причинная маска" checked={causal} onChange={(v) => attentionStore.getState().setParam('causal', v)} />
      </div>
      <div className="card" style={{ padding: '10px 14px', marginBottom: 12 }}>
        <strong>
          Шаг {stage + 1}. {STAGES[stage].title}
        </strong>{' '}
        <span className="muted">— запрос: «{example.tokens[qi]}»</span>
        {stage === 1 && !causal && (
          <p className="small" style={{ margin: '6px 0 0', color: theme.warn }}>
            Маска выключена, поэтому оценки не изменились. Включите тумблер «Причинная маска» — и всё, что правее запроса, погаснет.
          </p>
        )}
        {stage === 1 && causal && qi === example.tokens.length - 1 && (
          <p className="small muted" style={{ margin: '6px 0 0' }}>
            Запрос — последний токен, справа от него ничего нет: маска здесь ничего не отрезает. Выберите токен левее, чтобы увидеть эффект.
          </p>
        )}
      </div>
      {stage < 3 ? (
        <BarChart
          items={items}
          max={stage === 2 ? 1 : Math.max(6, ...scores)}
          orientation="vertical"
          height={200}
          format={(v) => (stage === 2 ? fmtFixed(v, 2) : fmtFixed(v, 1))}
        />
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {example.tokens.map((t, j) => (
            <div key={j} className="row" style={{ gap: 8, opacity: masked(j) ? 0.3 : 1 }}>
              <span className="mono" style={{ width: 70, fontSize: 13 }}>
                {t}
              </span>
              <span className="mono muted" style={{ width: 54, fontSize: 12 }}>
                × {fmtFixed(weights[j], 2)}
              </span>
              <Strip v={valueOf(t)} alpha={0.35 + 0.65 * weights[j]} />
            </div>
          ))}
          <div className="row" style={{ gap: 8, marginTop: 6, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <span className="mono" style={{ width: 70, fontSize: 13, fontWeight: 700 }}>
              итог
            </span>
            <span className="mono muted" style={{ width: 54, fontSize: 12 }}>
              Σ
            </span>
            <Strip v={output} alpha={1} />
          </div>
        </div>
      )}
      <div style={{ marginTop: 14 }}>
        <Stepper step={stage} total={STAGES.length} onPrev={() => setStage((s) => s - 1)} onNext={() => setStage((s) => s + 1)} onSelect={setStage} />
      </div>
    </WidgetFrame>
  );
}

function Strip({ v, alpha }: { v: number[]; alpha: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 3, flex: 1 }}>
      {v.map((x, k) => (
        <span key={k} className="mono" style={{ flex: 1, textAlign: 'center', padding: '3px 0', borderRadius: 4, fontSize: 12, background: mixHex(theme.bg2, theme.accent2, x), opacity: alpha, color: x > 0.6 ? theme.bg : theme.text }}>
          {fmtFixed(x, 2)}
        </span>
      ))}
    </span>
  );
}

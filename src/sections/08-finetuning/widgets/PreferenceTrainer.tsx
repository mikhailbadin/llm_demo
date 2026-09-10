import { useState } from 'react';
import { Button, M, WidgetFrame } from '@/components/ui';
import { PREFERENCE_PAIRS } from '@/data/finetuning';
import { sigmoid } from '@/lib/math';
import { fmtFixed, fmtPct } from '@/lib/format';
import { theme } from '@/styles/theme';

const ETA = 1.2;
interface Row {
  /** награды до выбора — от них считается ровно один шаг градиента */
  rA0: number;
  rB0: number;
  rA: number;
  rB: number;
  choice: 'a' | 'b' | null;
}
const initial = (): Row[] =>
  PREFERENCE_PAIRS.map((_, i) => {
    const rA = 0.3 * Math.sin(i * 1.7);
    const rB = 0.3 * Math.cos(i * 2.3);
    return { rA0: rA, rB0: rB, rA, rB, choice: null };
  });

export function PreferenceTrainer() {
  const [rows, setRows] = useState<Row[]>(initial);
  const [i, setI] = useState(0);
  const pair = PREFERENCE_PAIRS[i];
  const row = rows[i];
  const pA = sigmoid(row.rA - row.rB);
  const done = rows.every((r) => r.choice !== null);
  const agree = rows.filter((r, k) => r.choice !== null && r.choice === PREFERENCE_PAIRS[k].human).length;
  const answered = rows.filter((r) => r.choice !== null).length;

  // Один шаг градиента по −log σ(r_win − r_lose) от исходных наград: повторный клик или смена
  // выбора не накапливают шаги, а пересчитывают тот же единственный шаг.
  const choose = (c: 'a' | 'b') => {
    setRows((prev) =>
      prev.map((r, k) => {
        if (k !== i) return r;
        const win = c === 'a' ? r.rA0 : r.rB0;
        const lose = c === 'a' ? r.rB0 : r.rA0;
        const grad = 1 - sigmoid(win - lose);
        const nWin = win + ETA * grad;
        const nLose = lose - ETA * grad;
        return { ...r, rA: c === 'a' ? nWin : nLose, rB: c === 'a' ? nLose : nWin, choice: c };
      }),
    );
  };

  return (
    <WidgetFrame
      title="Обучите модель наград"
      icon="👍"
      help="Для каждого вопроса выберите ответ, который вам больше нравится. Модель наград (здесь — просто два числа rA и rB на пару) делает один шаг градиента по функции Брэдли–Терри, и вероятность P(A ≻ B) сдвигается в вашу сторону."
      onReset={() => {
        setRows(initial());
        setI(0);
      }}
      note="В настоящем RLHF модель наград — это нейросеть, которая по тексту «вопрос + ответ» выдаёт число. Она обучается на сотнях тысяч таких сравнений, а потом оценивает ответы основной модели миллионы раз — людей на это не хватило бы."
    >
      <div className="small muted" style={{ marginBottom: 8 }}>
        Вопрос {i + 1} из {PREFERENCE_PAIRS.length}: <strong style={{ color: 'var(--text-strong)' }}>{pair.prompt}</strong>
      </div>
      <div className="grid-2">
        {(['a', 'b'] as const).map((c) => {
          const text = c === 'a' ? pair.a : pair.b;
          const r = c === 'a' ? row.rA : row.rB;
          const chosen = row.choice === c;
          return (
            <button
              key={c}
              type="button"
              className="card"
              aria-pressed={chosen}
              onClick={() => choose(c)}
              style={{ textAlign: 'left', cursor: 'pointer', borderColor: chosen ? theme.accent : row.choice ? theme.border : theme.border2, font: 'inherit', color: 'inherit', padding: '12px 14px' }}
            >
              <div className="row row--between small muted">
                <span>Ответ {c.toUpperCase()}</span>
                <span className="mono">
                  r{c.toUpperCase()} = {fmtFixed(r, 2)}
                </span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 14.5 }}>{text}</p>
              {chosen && <div className="small" style={{ color: theme.accent, marginTop: 6 }}>✓ ваш выбор</div>}
            </button>
          );
        })}
      </div>
      <div className="card" style={{ marginTop: 12, padding: '10px 14px' }}>
        <div className="row row--between" style={{ gap: 12 }}>
          <span>
            <M tex={String.raw`P(A \succ B) = \sigma(r_A - r_B) = `} /> <strong className="mono">{fmtPct(pA, 0)}</strong>
          </span>
          <span className="small muted">{row.choice ? 'после вашего выбора' : 'до выбора'}</span>
        </div>
        <div style={{ marginTop: 8, height: 10, borderRadius: 5, background: theme.bg2, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${pA * 100}%`, background: theme.accent, transition: 'width 0.4s' }} />
          <div style={{ flex: 1, background: theme.accent2 }} />
        </div>
        <div className="row row--between small muted" style={{ marginTop: 4 }}>
          <span>A</span>
          <span>B</span>
        </div>
      </div>
      <div className="row row--between" style={{ marginTop: 12 }}>
        <div className="btn-row">
          <Button size="sm" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>
            ← Назад
          </Button>
          <Button size="sm" variant="primary" onClick={() => setI((x) => Math.min(PREFERENCE_PAIRS.length - 1, x + 1))} disabled={i === PREFERENCE_PAIRS.length - 1 || !row.choice}>
            Далее →
          </Button>
        </div>
        <span className="small muted">
          Совпадений с типичным выбором людей: {agree} / {answered}
        </span>
      </div>
      {done && (
        <p style={{ marginTop: 12, marginBottom: 0 }}>
          Готово. Модель наград «выучила» ваши предпочтения: {agree === PREFERENCE_PAIRS.length ? 'они совпали с типичным выбором разметчиков — краткость, точность и безопасность.' : `в ${PREFERENCE_PAIRS.length - agree} случаях они отличаются от типичного выбора разметчиков — и это нормально: именно поэтому в реальности сравнения собирают у многих людей.`}
        </p>
      )}
    </WidgetFrame>
  );
}

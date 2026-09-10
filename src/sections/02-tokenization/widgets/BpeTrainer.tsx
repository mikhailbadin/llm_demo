import { useMemo, useState } from 'react';
import { Button, CoachMark, Slider, WidgetFrame } from '@/components/ui';
import { BPE_MODEL } from '@/data/model';
import { tokenizeBpe } from '@/lib/bpe';
import { plural } from '@/lib/format';

const MAX = BPE_MODEL.merges.length;
const DEFAULT_WORD = 'прочитать';

export function BpeTrainer() {
  const [k, setK] = useState(0);
  const [touched, setTouched] = useState(false);
  const [word, setWord] = useState(DEFAULT_WORD);
  const step = k > 0 ? BPE_MODEL.steps[k - 1] : null;
  const words = step ? step.words : BPE_MODEL.initialWords;
  const shown = useMemo(() => [...words].sort((a, b) => b.count - a.count).slice(0, 24), [words]);
  const vocabNew = BPE_MODEL.vocab.slice(BPE_MODEL.baseVocab.length, BPE_MODEL.baseVocab.length + k);
  const custom = useMemo(() => tokenizeBpe(word, BPE_MODEL, k), [word, k]);
  const setStep = (v: number) => {
    setK(Math.max(0, Math.min(MAX, v)));
    setTouched(true);
  };

  return (
    <WidgetFrame
      title="BPE шаг за шагом"
      icon="🧩"
      help={
        <>
          Слева — обучающий корпус: слова, разбитые на символы (▁ — конец слова). На каждом шаге алгоритм находит самую частую пару соседних символов и склеивает её в
          новый токен. Двигайте ползунок или нажимайте «Шаг», чтобы наблюдать, как из букв вырастают осмысленные кусочки.
        </>
      }
      onReset={() => {
        setK(0);
        setWord(DEFAULT_WORD);
        setTouched(false);
      }}

      note="Настоящие токенизаторы обучаются точно так же, только корпус — терабайты текста, а слияний — десятки тысяч. Поэтому частые слова вроде «the» становятся одним токеном, а редкие — цепочкой кусочков."
    >
      <div className="controls">
        <Slider label="Слияний выполнено" value={k} min={0} max={MAX} onChange={setStep} format={(v) => `${v} / ${MAX}`} />
        <div className="btn-row" style={{ alignSelf: 'end' }}>
          <Button size="sm" onClick={() => setStep(k - 1)} disabled={k === 0}>
            ← Шаг
          </Button>
          <Button size="sm" variant="primary" onClick={() => setStep(k + 1)} disabled={k >= MAX}>
            Шаг →
          </Button>
          <Button size="sm" onClick={() => setStep(MAX)} disabled={k >= MAX}>
            До конца
          </Button>
          <CoachMark show={!touched}>Нажмите «Шаг →»</CoachMark>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14, padding: '12px 14px' }}>
        {step ? (
          <>
            Шаг {k}: самая частая пара — <span className="chip chip--2 chip--sm">{step.pair[0]}</span> + <span className="chip chip--2 chip--sm">{step.pair[1]}</span>{' '}
            встречается <strong>{plural(step.count, ['раз', 'раза', 'раз'])}</strong> → новый токен <span className="chip chip--0 chip--sm">{step.newToken}</span>. Словарь:{' '}
            {plural(step.vocabSize, ['токен', 'токена', 'токенов'])}.
          </>
        ) : (
          <>
            Шаг 0: словарь состоит только из отдельных символов — букв, их вариантов с «▁» на конце слова и знаков препинания ({BPE_MODEL.baseVocab.length} штук).
            Каждое слово — цепочка отдельных букв.
          </>
        )}

      </div>

      <div className="grid-2">
        <div>
          <div className="small muted" style={{ marginBottom: 6 }}>
            Корпус (24 самых частых слова из {BPE_MODEL.initialWords.length})
          </div>
          <div style={{ display: 'grid', gap: 4, fontSize: 13.5 }}>
            {shown.map((w) => (
              <div key={w.word} className="row" style={{ gap: 6 }}>
                <span className="mono muted" style={{ width: 28, textAlign: 'right' }}>
                  {w.count}
                </span>
                <span className="chips" style={{ gap: 3 }}>
                  {w.symbols.map((s, i) => (
                    <span key={i} className={`chip chip--sm ${step && s === step.newToken ? 'chip--0 chip--hl' : s.length > 2 || (s.length === 2 && !s.endsWith('▁')) ? 'chip--1' : 'chip--muted'}`}>
                      {s}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="small muted" style={{ marginBottom: 6 }}>
            Новые токены словаря ({vocabNew.length})
          </div>
          <div className="chips" style={{ marginBottom: 16 }}>
            {vocabNew.length === 0 && <span className="muted small">пока пусто</span>}
            {vocabNew.map((t, i) => (
              <span key={t} className={`chip chip--sm ${i === vocabNew.length - 1 ? 'chip--0 chip--hl' : 'chip--1'}`}>
                {t}
              </span>
            ))}
          </div>
          <div className="field">
            <label className="field__label" htmlFor="bpe-word">
              <span>Проверьте на своём слове (после {plural(k, ['слияния', 'слияний', 'слияний'])})</span>

            </label>
            <input id="bpe-word" className="input" value={word} onChange={(e) => setWord(e.target.value)} spellCheck={false} />
          </div>
          <div className="chips" style={{ marginTop: 8 }}>
            {custom.map((t, i) => (
              <span key={i} className={`chip chip--sm chip--${i % 6}`}>
                {t.text}
              </span>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 8, marginBottom: 0 }}>
            {plural(custom.length, ['токен', 'токена', 'токенов'])} на {[...word].length} символов
          </p>
        </div>
      </div>
    </WidgetFrame>
  );
}

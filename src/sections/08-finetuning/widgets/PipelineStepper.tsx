import { useState } from 'react';
import { Stepper, WidgetFrame } from '@/components/ui';
import { PIPELINE_PROMPT, PIPELINE_STAGES } from '@/data/finetuning';
import { theme } from '@/styles/theme';

export function PipelineStepper() {
  const [i, setI] = useState(0);
  const s = PIPELINE_STAGES[i];
  return (
    <WidgetFrame
      title="Один вопрос — четыре этапа обучения"
      icon="🪜"
      help="Переключайте этапы и смотрите, как меняется ответ модели на один и тот же вопрос. Тексты ответов написаны вручную, но отражают типичное поведение моделей на каждом этапе."
      onReset={() => setI(0)}
      note={s.explain}
    >
      <div className="row" style={{ gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {PIPELINE_STAGES.map((st, k) => (
          <button
            key={st.id}
            type="button"
            className={`btn btn--sm${k === i ? ' btn--primary' : ''}`}
            aria-pressed={k === i}
            onClick={() => setI(k)}
            style={{ flex: '1 1 120px' }}
          >
            {k + 1}. {st.title}
          </button>
        ))}
      </div>
      <div className="grid-2" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
        <div className="card" style={{ padding: '12px 14px', fontSize: 14 }}>
          <div className="small muted">этап</div>
          <div style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 16 }}>{s.short}</div>
          <div className="small muted" style={{ marginTop: 10 }}>
            данные
          </div>
          <div>{s.data}</div>
          <div className="small muted" style={{ marginTop: 10 }}>
            масштаб
          </div>
          <div>{s.scale}</div>
        </div>
        <div className="card" style={{ padding: '12px 14px', borderColor: i === 3 ? theme.accent : undefined }}>
          <div className="small muted">
            вопрос: <span style={{ color: 'var(--text-strong)' }}>{PIPELINE_PROMPT}</span>
          </div>
          <pre className="pre" style={{ marginTop: 8, marginBottom: 0, fontFamily: 'var(--font)', fontSize: 14 }}>
            {s.answer}
          </pre>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <Stepper step={i} total={PIPELINE_STAGES.length} onPrev={() => setI((x) => x - 1)} onNext={() => setI((x) => x + 1)} onSelect={setI} />
      </div>
    </WidgetFrame>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Button, WidgetFrame, TokenChips } from '@/components/ui';
import { NGRAM_MODEL } from '@/data/model';
import { detokenize, displayToken, endSentence, nextDistribution, EOS } from '@/lib/ngram';
import { fmtPct, plural } from '@/lib/format';
import { theme } from '@/styles/theme';

const START = ['дети', 'играют'];
type Phase = 0 | 1 | 2 | 3; // 0 контекст → 1 модель → 2 распределение → 3 выбор

export function AutoregressiveLoop() {
  const [seq, setSeq] = useState<string[]>(START);
  const [phase, setPhase] = useState<Phase>(0);
  const [auto, setAuto] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<number | null>(null);

  const dist = nextDistribution(NGRAM_MODEL, seq).slice(0, 5);
  const chosen = dist[0];

  // Обновление состояния держим свободным от побочных эффектов: в строгом режиме
  // React вызывает функции-обновители дважды, и токен добавлялся бы по два раза за шаг.
  const step = () => {
    if (done) return;
    if (phase < 3) {
      setPhase((phase + 1) as Phase);
      return;
    }
    if (chosen.token === EOS) {
      setDone(true);
      setAuto(false);
      return;
    }
    setSeq([...seq, chosen.token]);
    setPhase(0);
  };

  useEffect(() => {
    if (!auto) return;
    timer.current = window.setInterval(step, 650);
    return () => {
      if (timer.current !== null) window.clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, phase, seq, done]);

  const reset = () => {
    setSeq(START);
    setPhase(0);
    setAuto(false);
    setDone(false);
  };

  const box = (active: boolean, color: string) => ({
    fill: active ? color : theme.surface,
    stroke: active ? color : theme.border2,
    strokeWidth: 1.5,
    rx: 10,
    style: { transition: 'fill 0.25s, stroke 0.25s' } as React.CSSProperties,
  });
  const txt = (active: boolean) => ({ fill: active ? theme.bg : theme.text, fontSize: 13, fontWeight: 600, textAnchor: 'middle' as const });

  return (
    <WidgetFrame
      title="Цикл генерации: предсказать → выбрать → добавить"
      icon="🔁"
      help="Нажимайте «Шаг», чтобы пройти один оборот цикла по фазам, или «Авто». Каждый оборот добавляет к тексту один токен. Здесь модель всегда берёт самый вероятный вариант; про случайный выбор — в разделе о генерации."
      onReset={reset}
      note="Этот цикл — единственное, что делает LLM во время ответа: один токен за оборот. Ответ на тысячу слов — это примерно полторы тысячи оборотов, и на каждом модель заново читает весь контекст."
    >
      <svg className="chart" viewBox="0 0 560 150" role="img" aria-label="Схема цикла генерации" style={{ maxHeight: 150 }}>
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill={theme.muted2} />
          </marker>
        </defs>
        <rect x={10} y={40} width={120} height={50} {...box(phase === 0, theme.accent)} />
        <text x={70} y={70} {...txt(phase === 0)}>1. Контекст</text>
        <rect x={160} y={40} width={110} height={50} {...box(phase === 1, theme.accent2)} />
        <text x={215} y={70} {...txt(phase === 1)}>2. Модель</text>
        <rect x={300} y={40} width={130} height={50} {...box(phase === 2, theme.warn)} />
        <text x={365} y={70} {...txt(phase === 2)}>3. Вероятности</text>
        <rect x={460} y={40} width={90} height={50} {...box(phase === 3, theme.ok)} />
        <text x={505} y={70} {...txt(phase === 3)}>4. Выбор</text>
        <line x1={130} y1={65} x2={158} y2={65} stroke={theme.muted2} strokeWidth={1.5} markerEnd="url(#arr)" />
        <line x1={270} y1={65} x2={298} y2={65} stroke={theme.muted2} strokeWidth={1.5} markerEnd="url(#arr)" />
        <line x1={430} y1={65} x2={458} y2={65} stroke={theme.muted2} strokeWidth={1.5} markerEnd="url(#arr)" />
        <path d="M505 90 L505 125 L70 125 L70 92" fill="none" stroke={phase === 3 ? theme.ok : theme.muted2} strokeWidth={1.5} markerEnd="url(#arr)" strokeDasharray={phase === 3 ? undefined : '4 4'} />
        <text x={288} y={140} fill={theme.muted} fontSize={11} textAnchor="middle">добавляем выбранный токен к контексту и повторяем</text>
      </svg>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <div>
          <div className="small muted" style={{ marginBottom: 6 }}>Контекст ({plural(seq.length, ['токен', 'токена', 'токенов'])})</div>

          <TokenChips tokens={seq.map((t, i) => ({ text: t, color: i % 6, highlight: phase === 0 && i === seq.length - 1 }))} showIds={false} />
          <p style={{ marginTop: 10, marginBottom: 0 }}>
            {done ? (
              <>
                Модель выбрала <strong>конец предложения</strong>: «{endSentence(detokenize(seq))}»
              </>
            ) : (
              <>«{detokenize(seq)} …»</>
            )}
          </p>
        </div>
        <div>
          <div className="small muted" style={{ marginBottom: 6 }}>
            {phase >= 2 ? 'Распределение по следующему токену' : 'Распределение появится на шаге 3'}
          </div>
          <div style={{ opacity: phase >= 2 ? 1 : 0.25, transition: 'opacity 0.3s' }}>
            {dist.map((c, i) => (
              <div key={c.token} className="row" style={{ gap: 8, marginBottom: 4 }}>
                <span className="mono" style={{ width: 70, color: phase === 3 && i === 0 ? theme.ok : undefined, fontWeight: phase === 3 && i === 0 ? 700 : 400 }}>
                  {displayToken(c.token)}
                </span>
                <div style={{ flex: 1, height: 10, background: theme.bg2, borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: `${c.p * 100}%`, height: '100%', background: i === 0 ? theme.ok : theme.accent2, transition: 'width 0.3s' }} />
                </div>
                <span className="mono small" style={{ width: 54, textAlign: 'right' }}>{fmtPct(c.p)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="btn-row" style={{ marginTop: 14 }}>
        <Button variant="primary" onClick={step} disabled={done || auto}>
          Шаг {phase + 1} → {phase === 3 ? 1 : phase + 2}
        </Button>
        <Button onClick={() => setAuto((a) => !a)} disabled={done}>
          {auto ? '⏸ Пауза' : '▶ Авто'}
        </Button>
        <span className="small muted">Фаза: {['контекст готов', 'модель считает', 'получили вероятности', `выбираем «${displayToken(chosen.token)}»`][phase]}</span>
      </div>
    </WidgetFrame>
  );
}

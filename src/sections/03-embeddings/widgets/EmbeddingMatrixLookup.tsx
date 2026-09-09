import { useState } from 'react';
import { TokenChips, WidgetFrame } from '@/components/ui';
import { createRng } from '@/lib/rng';
import { fmtFixed } from '@/lib/format';
import { mixHex, theme } from '@/styles/theme';

const VOCAB = ['и', 'на', 'кошка', 'собака', 'рыба', 'хлеб', 'ест', 'спит', 'смотрит', 'птица'];
const D = 8;
const SENTENCE = ['кошка', 'ест', 'рыбу', 'и', 'смотрит', 'на', 'птицу'];
const LEMMA: Record<string, string> = { рыбу: 'рыба', птицу: 'птица' };

const rng = createRng(7);
const E: number[][] = VOCAB.map(() => Array.from({ length: D }, () => Math.round(rng.gauss(0, 0.6) * 100) / 100));

function cellColor(v: number) {
  const t = Math.max(-1.5, Math.min(1.5, v)) / 1.5;
  return t >= 0 ? mixHex('#141b2b', theme.accent, t) : mixHex('#141b2b', theme.danger, -t);
}

export function EmbeddingMatrixLookup() {
  const [sel, setSel] = useState<number | null>(0);
  const rowOf = (tok: string) => VOCAB.indexOf(LEMMA[tok] ?? tok);
  const activeRow = sel !== null ? rowOf(SENTENCE[sel]) : null;
  return (
    <WidgetFrame
      title="Таблица эмбеддингов: номер токена → строка матрицы"
      icon="🗄️"
      help="Нажмите на токен предложения. Подсветится строка матрицы E, которую модель «достаёт» по номеру токена. Это и есть его вектор. Здесь 10 токенов × 8 чисел; у настоящей модели — 100 000 × 4 096."
      note="Матрица E — обычные параметры модели: при обучении её строки сдвигаются так, чтобы модель лучше предсказывала текст. Никто не задаёт координаты вручную."
    >
      <div className="small muted" style={{ marginBottom: 6 }}>Предложение (нажмите на токен)</div>
      <TokenChips
        tokens={SENTENCE.map((t, i) => ({ text: t, id: rowOf(t), color: i % 6, highlight: sel === i }))}
        onClick={(i) => setSel(i)}
      />
      <div className="small muted" style={{ margin: '14px 0 6px' }}>
        Матрица E: {VOCAB.length} токенов × {D} измерений
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `36px 90px repeat(${D}, 52px)`, gap: 3, fontSize: 12.5, minWidth: 560 }}>
          <div />
          <div />
          {Array.from({ length: D }, (_, j) => (
            <div key={j} className="muted mono" style={{ textAlign: 'center' }}>
              d{j + 1}
            </div>
          ))}
          {VOCAB.map((w, i) => (
            <RowItems key={w} i={i} w={w} active={activeRow === i} />
          ))}
        </div>
      </div>
      {activeRow !== null && (
        <p style={{ marginTop: 12, marginBottom: 0 }}>
          Токен «{SENTENCE[sel!]}» → номер {activeRow} → вектор [{E[activeRow].map((v) => fmtFixed(v, 2)).join(', ')}].
        </p>
      )}
    </WidgetFrame>
  );
}

function RowItems({ i, w, active }: { i: number; w: string; active: boolean }) {
  return (
    <>
      <div className="mono muted" style={{ textAlign: 'right', paddingRight: 4, color: active ? theme.accent : undefined }}>
        {i}
      </div>
      <div className="mono" style={{ color: active ? theme.text : theme.muted, fontWeight: active ? 700 : 400 }}>
        {w}
      </div>
      {E[i].map((v, j) => (
        <div
          key={j}
          className="mono"
          style={{
            textAlign: 'center',
            padding: '4px 0',
            borderRadius: 5,
            background: cellColor(v),
            color: Math.abs(v) > 0.8 ? theme.bg : theme.text,
            outline: active ? `2px solid ${theme.accent}` : 'none',
            outlineOffset: -1,
            transition: 'outline 0.15s',
          }}
        >
          {fmtFixed(v, 2)}
        </div>
      ))}
    </>
  );
}

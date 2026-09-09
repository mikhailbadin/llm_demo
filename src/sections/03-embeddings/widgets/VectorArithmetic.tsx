import { useMemo } from 'react';
import { Button, Select, WidgetFrame } from '@/components/ui';
import { BarChart } from '@/components/charts';
import { ANALOGY_PRESETS, CLUSTERS, EMBEDDING_WORDS, getWord } from '@/data/embeddings';
import { analogy } from '@/lib/embeddings';
import { fmtFixed } from '@/lib/format';
import { embeddingStore } from '@/scenes/EmbeddingSpace/store';
import { CLUSTER_COLORS } from '@/styles/theme';

const OPTIONS = CLUSTERS.flatMap((c) =>
  EMBEDDING_WORDS.filter((w) => w.cluster === c.id).map((w) => ({ value: w.id, label: `${w.word} · ${c.label.toLowerCase()}` })),
);

export function VectorArithmetic() {
  const a = embeddingStore((s) => s.params.a as string);
  const b = embeddingStore((s) => s.params.b as string);
  const c = embeddingStore((s) => s.params.c as string);
  const mode = embeddingStore((s) => s.params.mode);
  const result = useMemo(() => analogy(EMBEDDING_WORDS, a, b, c, 4), [a, b, c]);
  const set = (p: Record<string, string>) => embeddingStore.getState().setParams({ ...p, mode: 'analogy' });

  return (
    <WidgetFrame
      title="Арифметика смыслов: a − b + c = ?"
      icon="🧮"
      help="Выберите три слова. Мы вычтем из вектора a вектор b, прибавим c и найдём слова, ближайшие к результату. Тот же расчёт отображается стрелками в 3D-сцене ниже (режим «Арифметика»)."
      onReset={() => embeddingStore.getState().setParams({ a: 'король', b: 'мужчина', c: 'женщина', mode: 'neighbors' })}
      note="Так работает знаменитый пример «king − man + woman ≈ queen» из статьи о word2vec (2013). В наших данных это работает потому, что кластер «семья» построен из одинаковых сдвигов; в настоящих эмбеддингах такие закономерности возникают сами."
    >
      <div className="btn-row" style={{ marginBottom: 12 }}>
        {ANALOGY_PRESETS.map((p) => (
          <Button key={p.label} size="sm" onClick={() => set({ a: p.a, b: p.b, c: p.c })} variant={p.a === a && p.b === b && p.c === c ? 'primary' : 'default'}>
            {p.label}
          </Button>
        ))}
      </div>
      <div className="controls" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <Select label="a" value={a} options={OPTIONS} onChange={(v) => set({ a: v })} />
        <Select label="− b" value={b} options={OPTIONS} onChange={(v) => set({ b: v })} />
        <Select label="+ c" value={c} options={OPTIONS} onChange={(v) => set({ c: v })} />
      </div>
      <div className="grid-2">
        <div>
          <div className="small muted" style={{ marginBottom: 6 }}>Ближайшие к результату</div>
          <BarChart
            items={result.neighbors.map((n, i) => ({
              label: n.word.word,
              value: Math.max(n.cos, 0),
              highlight: i === 0,
              color: CLUSTER_COLORS[CLUSTERS.find((cl) => cl.id === n.word.cluster)!.colorIndex],
            }))}
            max={1}
            format={(v) => `cos ${fmtFixed(v, 2)}`}
          />
        </div>
        <div>
          <p style={{ marginTop: 0 }}>
            <strong>{getWord(a).word}</strong> − <strong>{getWord(b).word}</strong> + <strong>{getWord(c).word}</strong> ≈{' '}
            <strong style={{ color: 'var(--accent)' }}>{result.neighbors[0].word.word}</strong>
          </p>
          <p className="small muted">
            Результат — точка ({result.target.map((v) => fmtFixed(v, 1)).join(', ')}). Ближайшее слово к ней находится с косинусом {fmtFixed(result.neighbors[0].cos, 3)}.
          </p>
          <Button size="sm" variant={mode === 'analogy' ? 'default' : 'primary'} onClick={() => embeddingStore.getState().setParams({ mode: 'analogy' })}>
            {mode === 'analogy' ? '✓ Показано в 3D-сцене' : 'Показать стрелки в 3D-сцене'}
          </Button>
        </div>
      </div>
    </WidgetFrame>
  );
}

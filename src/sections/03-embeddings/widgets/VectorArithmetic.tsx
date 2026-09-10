import { useMemo } from 'react';
import { Button, Select, WidgetFrame } from '@/components/ui';
import { ANALOGY_PRESETS, CLUSTERS, EMBEDDING_WORDS, getWord } from '@/data/embeddings';
import { analogy } from '@/lib/embeddings';
import { fmtFixed } from '@/lib/format';
import { embeddingStore } from '@/scenes/EmbeddingSpace/store';
import { CLUSTER_COLORS } from '@/styles/theme';

export const EMBEDDING_SCENE_ID = 'embedding-scene';

const OPTIONS = CLUSTERS.flatMap((c) =>
  EMBEDDING_WORDS.filter((w) => w.cluster === c.id).map((w) => ({ value: w.id, label: `${w.word} · ${c.label.toLowerCase()}` })),
);

const DEFAULTS = { a: 'король', b: 'мужчина', c: 'женщина' };

export function VectorArithmetic() {
  const a = embeddingStore((s) => s.params.a as string);
  const b = embeddingStore((s) => s.params.b as string);
  const c = embeddingStore((s) => s.params.c as string);
  const mode = embeddingStore((s) => s.params.mode);
  const result = useMemo(() => analogy(EMBEDDING_WORDS, a, b, c, 4), [a, b, c]);
  const best = result.neighbors[0];
  const set = (p: Record<string, string>) => embeddingStore.getState().setParams({ ...p, mode: 'analogy' });
  const showInScene = () => {
    embeddingStore.getState().setParams({ mode: 'analogy' });
    document.getElementById(EMBEDDING_SCENE_ID)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <WidgetFrame
      title="Арифметика смыслов: a − b + c = ?"
      icon="🧮"
      help="Выберите три слова. Мы вычтем из вектора a вектор b, прибавим c и найдём слова, ближайшие к точке-результату (по расстоянию до неё). Тот же расчёт отображается стрелками в 3D-сцене выше в режиме «Арифметика» — кнопка «Показать в 3D-сцене» переключит режим и прокрутит к сцене."
      onReset={() => embeddingStore.getState().setParams({ ...DEFAULTS, mode: 'neighbors' })}
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
          <div className="small muted" style={{ marginBottom: 6 }}>Ближайшие к точке-результату</div>
          <ol style={{ margin: 0, paddingLeft: 22 }} aria-label="Ближайшие слова к результату">
            {result.neighbors.map((n, i) => (
              <li key={n.word.id} style={{ marginBottom: 4, fontWeight: i === 0 ? 700 : 400 }}>
                <span style={{ color: CLUSTER_COLORS[CLUSTERS.find((cl) => cl.id === n.word.cluster)!.colorIndex] }}>{n.word.word}</span>{' '}
                <span className="mono muted small">расстояние {fmtFixed(n.dist ?? 0, 2)} · cos {fmtFixed(n.cos, 2)}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <p style={{ marginTop: 0 }}>
            <strong>{getWord(a).word}</strong> − <strong>{getWord(b).word}</strong> + <strong>{getWord(c).word}</strong> ≈{' '}
            <strong style={{ color: 'var(--accent)' }}>{best ? best.word.word : '?'}</strong>
          </p>
          <p className="small muted">
            Результат — точка ({result.target.map((v) => fmtFixed(v, 1)).join(', ')}).{' '}
            {best && (
              <>
                Ближайшее слово к ней — «{best.word.word}» на расстоянии {fmtFixed(best.dist ?? 0, 2)}; для сравнения, соседние слова внутри кластера обычно в 0,5–1,5 друг от друга.
              </>
            )}
          </p>
          <Button size="sm" variant={mode === 'analogy' ? 'default' : 'primary'} onClick={showInScene}>
            {mode === 'analogy' ? '↑ Показано в 3D-сцене' : '↑ Показать в 3D-сцене'}
          </Button>
        </div>
      </div>
    </WidgetFrame>
  );
}

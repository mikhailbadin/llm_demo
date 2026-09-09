import { useMemo } from 'react';
import { SegmentedControl, Select } from '@/components/ui';
import { CLUSTERS, EMBEDDING_WORDS, getCluster, getWord, type ClusterId } from '@/data/embeddings';
import { farthestWord, nearestWords } from '@/lib/embeddings';
import { fmtFixed } from '@/lib/format';
import { embeddingStore } from '@/scenes/EmbeddingSpace/store';
import { CLUSTER_COLORS } from '@/styles/theme';

const OPTIONS = [{ value: '', label: '— выберите слово —' }, ...CLUSTERS.flatMap((c) => EMBEDDING_WORDS.filter((w) => w.cluster === c.id).map((w) => ({ value: w.id, label: `${w.word} (${c.label.toLowerCase()})` })))];

/** DOM-панель управления для 3D-сцены эмбеддингов. */
export function EmbeddingOverlay() {
  const mode = embeddingStore((s) => s.params.mode as 'neighbors' | 'analogy');
  const selected = embeddingStore((s) => s.selectedId);
  const a = embeddingStore((s) => s.params.a as string);
  const b = embeddingStore((s) => s.params.b as string);
  const c = embeddingStore((s) => s.params.c as string);
  const neighbors = useMemo(() => (selected ? nearestWords(EMBEDDING_WORDS, selected, 5) : []), [selected]);
  const farthest = useMemo(() => (selected ? farthestWord(EMBEDDING_WORDS, selected) : null), [selected]);
  const st = embeddingStore.getState();

  return (
    <>
      <SegmentedControl
        ariaLabel="Режим сцены"
        value={mode}
        onChange={(v) => st.setParams({ mode: v })}
        options={[
          { value: 'neighbors', label: 'Соседи' },
          { value: 'analogy', label: 'Арифметика' },
        ]}
      />
      {mode === 'neighbors' ? (
        <>
          <Select label="Слово" value={selected ?? ''} options={OPTIONS} onChange={(v) => st.select(v || null)} />
          {selected ? (
            <div>
              <div className="small muted" style={{ marginBottom: 4 }}>
                Ближайшие к «{getWord(selected).word}»
              </div>
              {neighbors.map((n) => (
                <div key={n.word.id} className="row row--between small" style={{ gap: 6, padding: '2px 0' }}>
                  <span style={{ color: CLUSTER_COLORS[getCluster(n.word.cluster as ClusterId).colorIndex] }}>{n.word.word}</span>
                  <span className="mono muted">{fmtFixed(n.cos, 2)}</span>
                </div>
              ))}
              {farthest && (
                <div className="row row--between small" style={{ gap: 6, padding: '6px 0 0', marginTop: 4, borderTop: '1px solid var(--border)' }}>
                  <span className="muted">дальше всех: {farthest.word.word}</span>
                  <span className="mono muted">{fmtFixed(farthest.cos, 2)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="small muted">Нажмите на точку в сцене или выберите слово из списка.</div>
          )}
        </>
      ) : (
        <>
          <Select label="a" value={a} options={OPTIONS.slice(1)} onChange={(v) => st.setParam('a', v)} />
          <Select label="− b" value={b} options={OPTIONS.slice(1)} onChange={(v) => st.setParam('b', v)} />
          <Select label="+ c" value={c} options={OPTIONS.slice(1)} onChange={(v) => st.setParam('c', v)} />
          <div className="small muted">Серая стрелка — разность a − b. Бирюзовая — та же разность, приложенная к c. Каркасная сфера — результат.</div>
        </>
      )}
    </>
  );
}

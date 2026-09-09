import { SegmentedControl, Select, Toggle } from '@/components/ui';
import { ATTENTION_EXAMPLES } from '@/data/attentionExamples';
import { attentionStore } from '@/scenes/Attention/store';

/** Общие контролы внимания: пример, голова, маска, все головы. Используются в панели 3D-сцены и в виджетах. */
export function AttentionControls({ compact }: { compact?: boolean }) {
  const exampleId = attentionStore((s) => s.params.example as string);
  const head = attentionStore((s) => s.params.head as number);
  const causal = attentionStore((s) => s.params.causal as boolean);
  const allHeads = attentionStore((s) => s.params.allHeads as boolean);
  const st = attentionStore.getState();
  return (
    <div className={compact ? 'row' : ''} style={compact ? { gap: 12 } : { display: 'grid', gap: 10 }}>
      <Select
        label={compact ? undefined : 'Предложение'}
        value={exampleId}
        options={ATTENTION_EXAMPLES.map((e) => ({ value: e.id, label: e.label }))}
        onChange={(v) => {
          const ex = ATTENTION_EXAMPLES.find((e) => e.id === v)!;
          st.setParam('example', v);
          st.select(`t${ex.focus}`);
        }}
      />
      <SegmentedControl
        ariaLabel="Голова внимания"
        value={String(head)}
        onChange={(v) => st.setParam('head', Number(v))}
        options={[
          { value: '0', label: 'Голова 1' },
          { value: '1', label: 'Голова 2' },
        ]}
      />
      {!compact && (
        <>
          <Toggle label="Причинная маска" checked={causal} onChange={(v) => st.setParam('causal', v)} />
          <Toggle label="Обе головы сразу" checked={allHeads} onChange={(v) => st.setParam('allHeads', v)} />
          <div className="small muted">Нажмите на токен в сцене, чтобы сделать его запросом. Наведите на дугу или столбик — увидите вес.</div>
        </>
      )}
    </div>
  );
}

import { useMemo } from 'react';
import { Button, Select, Slider } from '@/components/ui';
import { NGRAM_MODEL } from '@/data/model';
import { SAMPLING_PREFIXES } from '@/data/corpus';
import { nextDistribution, tokenizeText, EOS } from '@/lib/ngram';
import { transformDistribution, sampleIndex } from '@/lib/sampling';
import { createRng } from '@/lib/rng';
import { fmtFixed } from '@/lib/format';
import { probStore, setPrefix, SHOWN_BARS } from '@/scenes/ProbabilityLandscape/store';

export function ProbOverlay() {
  const prefix = probStore((s) => s.params.prefix as string);
  const generated = probStore((s) => s.params.generated as string);
  const temperature = probStore((s) => s.params.temperature as number);
  const topK = probStore((s) => s.params.topK as number);
  const topP = probStore((s) => s.params.topP as number);
  const seed = probStore((s) => s.params.seed as number);
  const pending = probStore((s) => s.params.pending as string);
  // Выпавший «⏎» ничего не дописывает — об этом нужно сказать, иначе кнопка кажется сломанной.
  const ended = probStore((s) => s.params.ended as boolean);
  const st = probStore.getState();
  const tokens = useMemo(() => tokenizeText(`${prefix} ${generated}`), [prefix, generated]);

  const sample = () => {
    // Выбираем из полного распределения; 20 столбиков в сцене — только для показа.
    const rows = transformDistribution(nextDistribution(NGRAM_MODEL, tokens), { temperature, topK: topK > 0 ? topK : null, topP: topP < 1 ? topP : null });
    const rng = createRng(seed * 7919 + tokens.length);
    const idx = sampleIndex(rows.map((r) => r.pFinal), rng);
    const tok = rows[idx].token;
    const s = probStore.getState();
    const prefixAtSample = s.params.prefix;
    s.setParams({ pending: tok, pendingIdx: idx < SHOWN_BARS ? idx : -1, dropNonce: (s.params.dropNonce as number) + 1, seed: seed + 1, ended: tok === EOS });
    // Слово приклеивается, когда шарик долетел. Если за это время сменили префикс или сбросили — не приклеиваем.
    window.setTimeout(() => {
      const cur = probStore.getState();
      if (cur.params.pending !== tok || cur.params.prefix !== prefixAtSample) return;
      cur.setParams({ pending: '', pendingIdx: -1, generated: tok === EOS ? cur.params.generated : `${cur.params.generated as string} ${tok}`.trim() });
    }, 800);
  };

  return (
    <>
      <Select label="Префикс" value={prefix} options={SAMPLING_PREFIXES} onChange={setPrefix} />
      <Slider label="Температура" value={temperature} min={0.1} max={2} step={0.1} onChange={(v) => st.setParam('temperature', v)} format={(v) => fmtFixed(v, 1)} />
      <Slider label="Top-k" value={topK} min={0} max={SHOWN_BARS} onChange={(v) => st.setParam('topK', v)} format={(v) => (v === 0 ? 'выкл' : String(v))} />
      <Slider label="Top-p" value={topP} min={0.1} max={1} step={0.05} onChange={(v) => st.setParam('topP', v)} format={(v) => (v >= 1 ? 'выкл' : fmtFixed(v, 2))} />
      <div className="btn-row">
        <Button size="sm" variant="primary" onClick={sample} disabled={!!pending}>
          🎲 Сэмплировать
        </Button>
        <Button size="sm" onClick={() => st.setParams({ generated: generated.split(' ').slice(0, -1).join(' '), ended: false })} disabled={!generated || !!pending}>
          ← Назад
        </Button>
      </div>
      <div className="small" style={{ wordBreak: 'break-word' }}>
        <span className="muted">{prefix}</span> {generated}
        {pending && <span className="muted"> …</span>}
      </div>
      {ended && !pending && <div className="small" style={{ color: 'var(--warn)' }}>Выпал «⏎» — модель считает текст законченным. Смените префикс или нажмите «← Назад».</div>}
    </>
  );
}

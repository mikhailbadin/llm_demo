import { useMemo, useState } from 'react';
import { Button, Select, Slider, TokenChips, WidgetFrame } from '@/components/ui';
import { BarChart } from '@/components/charts';
import { NGRAM_MODEL } from '@/data/model';
import { SAMPLING_PREFIXES } from '@/data/corpus';
import { detokenize, displayToken, generate, nextDistribution, tokenizeText, EOS } from '@/lib/ngram';
import { transformDistribution, sampleIndex, greedyIndex } from '@/lib/sampling';
import { createRng } from '@/lib/rng';
import { fmtFixed, fmtPct } from '@/lib/format';
import { probStore } from '@/scenes/ProbabilityLandscape/store';
import { theme } from '@/styles/theme';

export function SamplingPlayground() {
  const prefix = probStore((s) => s.params.prefix as string);
  const generated = probStore((s) => s.params.generated as string);
  const temperature = probStore((s) => s.params.temperature as number);
  const topK = probStore((s) => s.params.topK as number);
  const topP = probStore((s) => s.params.topP as number);
  const seed = probStore((s) => s.params.seed as number);
  const [lastP, setLastP] = useState<{ token: string; p: number }[]>([]);
  // Модель может выбрать «⏎» — конец текста. Без подписи кнопка выглядела бы сломанной: клик есть, а текст не растёт.
  const [ended, setEnded] = useState(false);
  const st = probStore.getState();

  const tokens = useMemo(() => tokenizeText(`${prefix} ${generated}`), [prefix, generated]);
  const opts = { temperature, topK: topK > 0 ? topK : null, topP: topP < 1 ? topP : null };
  // Сэмплируем из полного распределения, а показываем только первые 12 столбиков:
  // иначе и счётчик «оставлено», и случайный выбор считались бы по обрезанному списку.
  const all = useMemo(() => transformDistribution(nextDistribution(NGRAM_MODEL, tokens), opts), [tokens, temperature, topK, topP]); // eslint-disable-line react-hooks/exhaustive-deps
  const rows = all.slice(0, 12);
  const kept = all.filter((r) => r.kept).length;

  const appendToken = (tok: string, p: number) => {
    if (tok === EOS) {
      setEnded(true);
      return;
    }
    setEnded(false);
    st.setParams({ generated: `${generated} ${tok}`.trim() });
    setLastP((l) => [...l, { token: tok, p }]);
  };
  const sampleOne = () => {
    const rng = createRng(seed * 7919 + tokens.length);
    const idx = sampleIndex(all.map((r) => r.pFinal), rng);
    appendToken(all[idx].token, all[idx].pFinal);
    st.setParam('seed', seed + 1);
  };
  const greedyOne = () => {
    const idx = greedyIndex(all.map((r) => r.pFinal));
    appendToken(all[idx].token, all[idx].pFinal);
  };
  const generateMany = () => {
    const rng = createRng(seed * 7919);
    const out = generate(NGRAM_MODEL, tokens, 10, rng, opts);
    st.setParams({ generated: `${generated} ${out.join(' ')}`.trim(), seed: seed + 1 });
    setLastP((l) => [...l, ...out.map((t) => ({ token: t, p: NaN }))]);
  };
  const reset = () => {
    st.setParams({ generated: '', temperature: 1, topK: 0, topP: 1, seed: 1 });
    setLastP([]);
    setEnded(false);
  };

  return (
    <WidgetFrame
      title="Песочница сэмплирования"
      icon="🎲"
      help="Выберите префикс и крутите ползунки: температура меняет форму распределения, top-k и top-p отсекают хвост (серые столбики). Пунктир — исходное распределение при T = 1. Кнопки добавляют слова к тексту; seed делает случайность воспроизводимой. Те же настройки отображаются в 3D-сцене ниже."
      onReset={reset}
      note="Температура → 0 превращает сэмплирование в жадный выбор; top-k = 1 — тоже. Top-p = 1 ничего не отсекает. Один и тот же seed при тех же настройках даёт тот же текст — «случайность» в компьютере всегда управляема."
    >
      <div className="controls">
        <Select label="Префикс" value={prefix} options={SAMPLING_PREFIXES} onChange={(v) => { st.setParams({ prefix: v, generated: '' }); setLastP([]); }} />
        <Slider label="Температура T" value={temperature} min={0.1} max={2} step={0.1} onChange={(v) => st.setParam('temperature', v)} format={(v) => fmtFixed(v, 1)} />
        <Slider label="Top-k" value={topK} min={0} max={30} onChange={(v) => st.setParam('topK', v)} format={(v) => (v === 0 ? 'выкл' : String(v))} />
        <Slider label="Top-p" value={topP} min={0.1} max={1} step={0.05} onChange={(v) => st.setParam('topP', v)} format={(v) => (v >= 1 ? 'выкл' : fmtFixed(v, 2))} />
      </div>
      <div className="grid-2">
        <div>
          <div className="small muted" style={{ marginBottom: 4 }}>
            Кандидаты после «{tokens.slice(-3).join(' ')}» · оставлено {kept} из {NGRAM_MODEL.vocab.length}
          </div>
          <BarChart
            items={rows.map((r, i) => ({
              label: displayToken(r.token),
              value: r.kept ? r.pFinal : r.pTemp,
              ghost: r.pOriginal,
              muted: !r.kept,
              highlight: i === 0 && r.kept,
              title: r.kept ? `итоговая ${fmtPct(r.pFinal)} · после T ${fmtPct(r.pTemp)} · исходная ${fmtPct(r.pOriginal)}` : `отсечено (было ${fmtPct(r.pTemp)})`,
            }))}
            format={(v) => fmtPct(v)}
            onClick={(i) => rows[i].kept && appendToken(rows[i].token, rows[i].pFinal)}
          />
        </div>
        <div>
          <div className="btn-row" style={{ marginBottom: 10 }}>
            <Button size="sm" onClick={greedyOne}>
              Жадно
            </Button>
            <Button size="sm" variant="primary" onClick={sampleOne}>
              Сэмплировать
            </Button>
            <Button size="sm" onClick={generateMany}>
              +10 слов
            </Button>
            <span className="small muted">seed {seed}</span>
          </div>
          <div className="card" style={{ padding: '10px 12px', minHeight: 90 }}>
            <span className="muted">{prefix}</span>{' '}
            <TokenChips
              size="sm"
              showIds={false}
              tokens={tokenizeText(generated).map((t, i) => ({ text: t, color: i % 6, title: lastP[i] && !Number.isNaN(lastP[i].p) ? `p = ${fmtPct(lastP[i].p)}` : undefined }))}
            />
            {generated && <p style={{ margin: '8px 0 0' }}>«{detokenize(tokens)}»</p>}
            {ended && (
              <p className="small" style={{ margin: '8px 0 0', color: theme.warn }}>
                Выпал токен «⏎» — конец текста: продолжать нечего. Нажмите «Сбросить» или выберите другой префикс.
              </p>
            )}
          </div>
        </div>
      </div>
    </WidgetFrame>
  );
}

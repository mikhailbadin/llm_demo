import { useMemo, useState } from 'react';
import { Button, Select, Slider, TokenChips, WidgetFrame } from '@/components/ui';
import { BarChart } from '@/components/charts';
import { NGRAM_MODEL } from '@/data/model';
import { SAMPLING_PREFIXES } from '@/data/corpus';
import { detokenize, displayToken, generate, nextDistribution, tokenizeText, EOS } from '@/lib/ngram';
import { transformDistribution, sampleIndex, greedyIndex } from '@/lib/sampling';
import { createRng } from '@/lib/rng';
import { fmtFixed, fmtPct } from '@/lib/format';
import { probStore, resetSampling, setPrefix, SHOWN_BARS } from '@/scenes/ProbabilityLandscape/store';
import { theme } from '@/styles/theme';

const MANY = 10;

export function SamplingPlayground() {
  const prefix = probStore((s) => s.params.prefix as string);
  const generated = probStore((s) => s.params.generated as string);
  const temperature = probStore((s) => s.params.temperature as number);
  const topK = probStore((s) => s.params.topK as number);
  const topP = probStore((s) => s.params.topP as number);
  const seed = probStore((s) => s.params.seed as number);
  const pending = probStore((s) => s.params.pending as string);
  // Модель может выбрать «⏎» — конец текста. Без подписи кнопка выглядела бы сломанной: клик есть, а текст не растёт.
  const ended = probStore((s) => s.params.ended as boolean);
  // Вероятности добавленных слов — для подсказок на чипах. Сбрасываются вместе с текстом.
  const [lastP, setLastP] = useState<{ token: string; p: number }[]>([]);
  const st = probStore.getState();

  const tokens = useMemo(() => tokenizeText(`${prefix} ${generated}`), [prefix, generated]);
  const opts = useMemo(() => ({ temperature, topK: topK > 0 ? topK : null, topP: topP < 1 ? topP : null }), [temperature, topK, topP]);
  // Сэмплируем из полного распределения, а показываем только первые 12 столбиков:
  // иначе и счётчик «оставлено», и случайный выбор считались бы по обрезанному списку.
  const all = useMemo(() => transformDistribution(nextDistribution(NGRAM_MODEL, tokens), opts), [tokens, opts]);
  const rows = all.slice(0, 12);
  const kept = all.filter((r) => r.kept).length;
  const generatedTokens = tokenizeText(generated);
  const appendToken = (tok: string, p: number) => {
    if (tok === EOS) {
      st.setParam('ended', true);
      return;
    }
    st.setParams({ generated: `${generated} ${tok}`.trim(), ended: false });
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
    const out = generate(NGRAM_MODEL, tokens, MANY, rng, opts);
    // Меньше MANY слов — значит, по дороге выпал «⏎» и текст закончился.
    st.setParams({ generated: `${generated} ${out.join(' ')}`.trim(), seed: seed + 1, ended: out.length < MANY });
    setLastP((l) => [...l, ...out.map((t) => ({ token: t, p: NaN }))]);
  };
  const changePrefix = (v: string) => {
    setPrefix(v);
    setLastP([]);
  };
  const reset = () => {
    resetSampling();
    setLastP([]);
  };

  return (
    <WidgetFrame
      title="Песочница сэмплирования"
      icon="🎲"
      help="Выберите префикс и крутите ползунки: температура меняет форму распределения, top-k и top-p отсекают хвост (серые столбики). Пунктир — исходное распределение при T = 1. «Жадно» добавляет самый вероятный токен, «Сэмплировать» — случайный по вероятностям, «+10 слов» — целую фразу; можно и просто нажать на столбик. Счётчик seed показывает, какое зерно случайности будет использовано следующим: с тем же seed и настройками результат повторится. Те же настройки и текст отображаются в 3D-сцене ниже."
      onReset={reset}
      note="Температура → 0 превращает сэмплирование в жадный выбор (если лидер один); top-k = 1 — тоже. Top-p = 1 ничего не отсекает. Один и тот же seed при тех же настройках даёт тот же текст — «случайность» в компьютере всегда управляема."
    >
      <div className="controls">
        <Select label="Префикс" value={prefix} options={SAMPLING_PREFIXES} onChange={changePrefix} />
        <Slider label="Температура T" value={temperature} min={0.1} max={2} step={0.1} onChange={(v) => st.setParam('temperature', v)} format={(v) => fmtFixed(v, 1)} />
        <Slider label="Top-k" value={topK} min={0} max={SHOWN_BARS} onChange={(v) => st.setParam('topK', v)} format={(v) => (v === 0 ? 'выкл' : String(v))} />
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
            ariaLabel="Кандидаты на следующий токен"
          />
        </div>
        <div>
          <div className="btn-row" style={{ marginBottom: 10 }}>
            <Button size="sm" onClick={greedyOne} disabled={!!pending}>
              Жадно
            </Button>
            <Button size="sm" variant="primary" onClick={sampleOne} disabled={!!pending}>
              Сэмплировать
            </Button>
            <Button size="sm" onClick={generateMany} disabled={!!pending}>
              +{MANY} слов
            </Button>
            <span className="small muted">seed {seed}</span>
          </div>
          <div className="card" style={{ padding: '10px 12px', minHeight: 90 }}>
            <span className="muted">{prefix}</span>{' '}
            <TokenChips
              size="sm"
              showIds={false}
              tokens={generatedTokens.map((t, i) => ({ text: t, color: i % 6, title: lastP[i] && !Number.isNaN(lastP[i].p) ? `p = ${fmtPct(lastP[i].p)}` : undefined }))}
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

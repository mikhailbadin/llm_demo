import { useState } from 'react';
import { Button, Select, Slider, Toggle, WidgetFrame } from '@/components/ui';
import { MODEL_PRESETS } from '@/data/presets';
import { estimateParams, sameConfig, BYTES_PER_PARAM, type ModelConfig } from '@/lib/params';
import { fmtBig, fmtBytes, fmtPct } from '@/lib/format';
import { theme } from '@/styles/theme';

const D_OPTIONS = [128, 256, 512, 768, 1024, 1600, 2048, 4096, 8192, 12288].map((v) => ({ value: String(v), label: String(v) }));
const V_OPTIONS = [8000, 32000, 50257, 100000, 128000, 256000].map((v) => ({ value: String(v), label: v.toLocaleString('ru-RU') }));
const C_OPTIONS = [512, 1024, 2048, 4096, 8192, 32768, 131072].map((v) => ({ value: String(v), label: v.toLocaleString('ru-RU') }));

/** Голов может быть только столько, на сколько d_model делится нацело: ползунок «прилипает» к делителям. */
function nearestDivisor(d: number, v: number): number {
  const target = Math.max(1, Math.min(d, v));
  let best = 1;
  for (let k = 1; k <= d && k <= 128; k++) {
    if (d % k === 0 && Math.abs(k - target) < Math.abs(best - target)) best = k;
  }
  return best;
}

export function ParameterCalculator() {
  const [cfg, setCfg] = useState<ModelConfig>(MODEL_PRESETS[0].cfg);
  const r = estimateParams(cfg);
  const set = (p: Partial<ModelConfig>) => setCfg((c) => ({ ...c, ...p }));
  const preset = MODEL_PRESETS.find((p) => sameConfig(p.cfg, cfg));
  const parts = [
    { label: 'Внимание', v: r.attention, c: theme.orange },
    { label: 'MLP', v: r.mlp, c: theme.accent2 },
    { label: 'Эмбеддинги', v: r.embedding, c: theme.accent },
    { label: 'Выходной слой', v: r.output, c: theme.warn },
    { label: 'Позиции', v: r.positional, c: theme.muted2 },
  ].filter((p) => p.v > 0);

  return (
    <WidgetFrame
      title="Калькулятор параметров"
      icon="🧮"
      help="Выберите размеры модели или нажмите на пресет. Число параметров считается по упрощённой формуле 12·L·d² + |V|·d (без bias и LayerNorm) плюс, если включены тумблеры, обучаемые позиционные векторы C·d и отдельная выходная матрица |V|·d. Число голов на итог не влияет — оно делит d между головами: подпись «12 × 64» означает 12 голов по 64 измерения."
      onReset={() => setCfg(MODEL_PRESETS[0].cfg)}
      note="Обратите внимание на долю MLP: две трети параметров блока — не во внимании, а в «полносвязных» слоях. А ещё на память: 7 миллиардов параметров в fp16 — это 14 ГБ, поэтому модели квантуют до int8 и int4."
    >
      <div className="btn-row" style={{ marginBottom: 12 }}>
        {MODEL_PRESETS.map((p) => (
          <Button key={p.id} size="sm" variant={preset?.id === p.id ? 'primary' : 'default'} onClick={() => setCfg(p.cfg)}>
            {p.label}
          </Button>
        ))}
      </div>
      <div className="controls">
        <Select label="d_model (размер вектора)" value={String(cfg.dModel)} options={D_OPTIONS} onChange={(v) => set({ dModel: Number(v), heads: nearestDivisor(Number(v), cfg.heads) })} />
        <Slider label="L — число блоков" value={cfg.layers} min={1} max={128} onChange={(v) => set({ layers: v })} />
        <Slider
          label="Голов внимания"
          hint="(на N не влияет)"
          value={cfg.heads}
          min={1}
          max={128}
          onChange={(v) => set({ heads: nearestDivisor(cfg.dModel, v) })}
          format={(v) => `${v} × ${Math.max(1, Math.round(cfg.dModel / v))}`}
        />
        <Select label="|V| — словарь" value={String(cfg.vocab)} options={V_OPTIONS} onChange={(v) => set({ vocab: Number(v) })} />
        <Select label="Контекст (токенов)" value={String(cfg.context)} options={C_OPTIONS} onChange={(v) => set({ context: Number(v) })} />
        <div style={{ display: 'grid', gap: 6, alignSelf: 'end' }}>
          <Toggle label="Обучаемые позиционные векторы (нет у RoPE)" checked={cfg.learnedPositions ?? true} onChange={(v) => set({ learnedPositions: v })} />
          <Toggle label="Выходная матрица = таблица эмбеддингов" checked={cfg.tiedOutput ?? true} onChange={(v) => set({ tiedOutput: v })} />
        </div>
      </div>
      <div className="stat-row">
        <div className="stat">
          <span className="stat__label">Всего параметров</span>
          <span className="stat__value">{fmtBig(r.total)}</span>
        </div>
        {preset && (
          <div className="stat">
            <span className="stat__label">Официально</span>
            <span className="stat__value stat__value--sm">{preset.official}</span>
          </div>
        )}
        <div className="stat">
          <span className="stat__label">На один блок</span>
          <span className="stat__value stat__value--sm">{fmtBig(r.perLayer)}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Память fp16 / int8 / int4</span>
          <span className="stat__value stat__value--sm">
            {fmtBytes(r.total * BYTES_PER_PARAM.fp16)} / {fmtBytes(r.total * BYTES_PER_PARAM.int8)} / {fmtBytes(r.total * BYTES_PER_PARAM.int4)}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', height: 22, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {parts.map((p) => (
          <div key={p.label} title={`${p.label}: ${fmtBig(p.v)}`} style={{ width: `${(p.v / r.total) * 100}%`, background: p.c, transition: 'width 0.3s' }} />
        ))}
      </div>
      <div className="row small" style={{ marginTop: 6, gap: 14 }}>
        {parts.map((p) => (
          <span key={p.label}>
            <span style={{ display: 'inline-block', width: 10, height: 10, background: p.c, borderRadius: 2, marginRight: 5 }} />
            {p.label} {fmtPct(p.v / r.total, 0)}
          </span>
        ))}
      </div>
    </WidgetFrame>
  );
}

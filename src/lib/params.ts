export interface ModelConfig {
  dModel: number;
  layers: number;
  vocab: number;
  heads: number;
  context: number;
}

export interface ParamBreakdown {
  attention: number;
  mlp: number;
  embedding: number;
  positional: number;
  total: number;
  perLayer: number;
}

/** Грубая оценка числа параметров decoder-only трансформера (без bias и LayerNorm). */
export function estimateParams(cfg: ModelConfig): ParamBreakdown {
  const d = cfg.dModel;
  const attention = 4 * d * d * cfg.layers;
  const mlp = 8 * d * d * cfg.layers;
  const embedding = cfg.vocab * d;
  const positional = cfg.context * d;
  const total = attention + mlp + embedding + positional;
  return { attention, mlp, embedding, positional, total, perLayer: 12 * d * d };
}

export const BYTES_PER_PARAM = { fp32: 4, fp16: 2, int8: 1, int4: 0.5 } as const;

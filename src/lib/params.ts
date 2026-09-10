export interface ModelConfig {
  dModel: number;
  layers: number;
  vocab: number;
  heads: number;
  context: number;
  /** Обучаемые позиционные векторы (GPT-2, GPT-3). У моделей с RoPE их нет. По умолчанию true. */
  learnedPositions?: boolean;
  /** Выходная матрица — та же таблица эмбеддингов (GPT-2, GPT-3). В Llama она отдельная. По умолчанию true. */
  tiedOutput?: boolean;
}

export interface ParamBreakdown {
  attention: number;
  mlp: number;
  embedding: number;
  /** отдельная выходная матрица; 0, если веса связаны с эмбеддингами */
  output: number;
  /** обучаемые позиционные векторы; 0 для RoPE */
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
  const output = cfg.tiedOutput === false ? cfg.vocab * d : 0;
  const positional = cfg.learnedPositions === false ? 0 : cfg.context * d;
  const total = attention + mlp + embedding + output + positional;
  return { attention, mlp, embedding, output, positional, total, perLayer: 12 * d * d };
}

/** Две конфигурации равны, если совпадают все размеры и флаги (с учётом значений по умолчанию). */
export function sameConfig(a: ModelConfig, b: ModelConfig): boolean {
  return (
    a.dModel === b.dModel &&
    a.layers === b.layers &&
    a.vocab === b.vocab &&
    a.heads === b.heads &&
    a.context === b.context &&
    (a.learnedPositions ?? true) === (b.learnedPositions ?? true) &&
    (a.tiedOutput ?? true) === (b.tiedOutput ?? true)
  );
}

export const BYTES_PER_PARAM = { fp32: 4, fp16: 2, int8: 1, int4: 0.5 } as const;

import type { ModelConfig } from '@/lib/params';

export interface ModelPreset {
  id: string;
  label: string;
  cfg: ModelConfig;
  official: string;
}

export const MODEL_PRESETS: ModelPreset[] = [
  { id: 'gpt2', label: 'GPT-2 small', cfg: { dModel: 768, layers: 12, heads: 12, vocab: 50257, context: 1024 }, official: '124 млн' },
  { id: 'gpt2xl', label: 'GPT-2 XL', cfg: { dModel: 1600, layers: 48, heads: 25, vocab: 50257, context: 1024 }, official: '1,56 млрд' },
  // Llama 2 7B: RoPE (обучаемых позиций нет), отдельная выходная матрица, SwiGLU-MLP с hidden 11008 ≈ 2,7d —
  // по числу параметров это почти те же 8d² на блок, что и у 4d-MLP.
  { id: 'llama7b', label: '7B-модель (Llama)', cfg: { dModel: 4096, layers: 32, heads: 32, vocab: 32000, context: 4096, learnedPositions: false, tiedOutput: false }, official: '6,74 млрд' },
  { id: 'gpt3', label: 'GPT-3', cfg: { dModel: 12288, layers: 96, heads: 96, vocab: 50257, context: 2048 }, official: '175 млрд' },
];

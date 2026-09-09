import type { ModelConfig } from '@/lib/params';

export interface ModelPreset {
  id: string;
  label: string;
  cfg: ModelConfig;
  official: string;
}

export const MODEL_PRESETS: ModelPreset[] = [
  { id: 'gpt2', label: 'GPT-2 small', cfg: { dModel: 768, layers: 12, heads: 12, vocab: 50257, context: 1024 }, official: '124 млн' },
  { id: 'gpt2xl', label: 'GPT-2 XL', cfg: { dModel: 1600, layers: 48, heads: 25, vocab: 50257, context: 1024 }, official: '1,5 млрд' },
  { id: 'llama7b', label: '7B-модель', cfg: { dModel: 4096, layers: 32, heads: 32, vocab: 32000, context: 4096 }, official: '≈ 7 млрд' },
  { id: 'gpt3', label: 'GPT-3', cfg: { dModel: 12288, layers: 96, heads: 96, vocab: 50257, context: 2048 }, official: '175 млрд' },
];

import type { ComponentType, LazyExoticComponent } from 'react';

export type SectionId =
  | 'intro'
  | 'tokenization'
  | 'embeddings'
  | 'attention'
  | 'transformer'
  | 'training'
  | 'sampling'
  | 'finetuning'
  | 'prompting'
  | 'glossary';

export interface SectionMeta {
  id: SectionId;
  slug: string;
  order: number;
  title: string;
  shortTitle: string;
  description: string;
  minutes: number;
  has3d: boolean;
  component: LazyExoticComponent<ComponentType>;
}

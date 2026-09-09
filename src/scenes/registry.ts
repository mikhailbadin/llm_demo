import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { SceneStore } from './store';

export interface SceneProps {
  store: SceneStore;
  active: boolean;
}

export type SceneComponent = ComponentType<SceneProps>;

export type SceneId = 'embedding-space' | 'attention' | 'transformer-stack' | 'probability-landscape' | 'loss-surface';

/** Ленивые загрузчики сцен: three.js попадает в бандл только вместе с ними. */
export const SCENE_LOADERS: Record<SceneId, () => Promise<{ default: SceneComponent }>> = {
  'embedding-space': () => import('./EmbeddingSpace'),
  attention: () => import('./Attention'),
  'transformer-stack': () => import('./TransformerStack'),
  'probability-landscape': () => import('./ProbabilityLandscape'),
  'loss-surface': () => import('./LossSurface'),
};

/** Ленивые компоненты сцен, созданные один раз на уровне модуля. */
export const SCENE_COMPONENTS: Record<SceneId, LazyExoticComponent<SceneComponent>> = {
  'embedding-space': lazy(SCENE_LOADERS['embedding-space']),
  attention: lazy(SCENE_LOADERS.attention),
  'transformer-stack': lazy(SCENE_LOADERS['transformer-stack']),
  'probability-landscape': lazy(SCENE_LOADERS['probability-landscape']),
  'loss-surface': lazy(SCENE_LOADERS['loss-surface']),
};

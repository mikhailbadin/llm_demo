import { lazy } from 'react';
import type { SectionId, SectionMeta } from './types';

export const SECTIONS: SectionMeta[] = [
  {
    id: 'intro',
    slug: 'intro',
    order: 1,
    title: 'Что такое языковая модель',
    shortTitle: 'Что такое LLM',
    description: 'Модель как предсказатель следующего токена, цикл генерации и карта курса.',
    minutes: 10,
    has3d: false,
    component: lazy(() => import('./01-intro')),
  },
  {
    id: 'tokenization',
    slug: 'tokenization',
    order: 2,
    title: 'Токенизация: из текста в числа',
    shortTitle: 'Токенизация',
    description: 'Символы, слова и подслова. Алгоритм BPE шаг за шагом.',
    minutes: 12,
    has3d: false,
    component: lazy(() => import('./02-tokenization')),
  },
  {
    id: 'embeddings',
    slug: 'embeddings',
    order: 3,
    title: 'Эмбеддинги: смысл как вектор',
    shortTitle: 'Эмбеддинги',
    description: 'Слова как точки в пространстве, косинусная близость и арифметика смыслов.',
    minutes: 15,
    has3d: true,
    component: lazy(() => import('./03-embeddings')),
  },
  {
    id: 'attention',
    slug: 'attention',
    order: 4,
    title: 'Внимание: как токены смотрят друг на друга',
    shortTitle: 'Внимание',
    description: 'Query, Key, Value, softmax и причинная маска — сердце трансформера.',
    minutes: 18,
    has3d: true,
    component: lazy(() => import('./04-attention')),
  },
  {
    id: 'transformer',
    slug: 'transformer',
    order: 5,
    title: 'Архитектура трансформера',
    shortTitle: 'Трансформер',
    description: 'Блоки, остаточный поток, позиционное кодирование и подсчёт параметров.',
    minutes: 15,
    has3d: true,
    component: lazy(() => import('./05-transformer')),
  },
  {
    id: 'training',
    slug: 'training',
    order: 6,
    title: 'Обучение: предсказание следующего токена',
    shortTitle: 'Обучение',
    description: 'Cross-entropy, perplexity и градиентный спуск по ландшафту потерь.',
    minutes: 15,
    has3d: true,
    component: lazy(() => import('./06-training')),
  },
  {
    id: 'sampling',
    slug: 'sampling',
    order: 7,
    title: 'Генерация: температура, top-k и top-p',
    shortTitle: 'Генерация',
    description: 'Как из вероятностей рождается текст и чем управляет температура.',
    minutes: 12,
    has3d: true,
    component: lazy(() => import('./07-sampling')),
  },
  {
    id: 'finetuning',
    slug: 'finetuning',
    order: 8,
    title: 'Дообучение: от базовой модели к ассистенту',
    shortTitle: 'Дообучение',
    description: 'SFT, модель наград и RLHF: почему модель отвечает, а не продолжает.',
    minutes: 12,
    has3d: false,
    component: lazy(() => import('./08-finetuning')),
  },
  {
    id: 'prompting',
    slug: 'prompting',
    order: 9,
    title: 'Промпты, контекст и ограничения',
    shortTitle: 'Промпты и контекст',
    description: 'Контекстное окно, chat-шаблоны, приёмы промптинга и галлюцинации.',
    minutes: 12,
    has3d: false,
    component: lazy(() => import('./09-prompting')),
  },
  {
    id: 'glossary',
    slug: 'glossary',
    order: 10,
    title: 'Итоги и глоссарий',
    shortTitle: 'Итоги и глоссарий',
    description: 'Как всё связано, и словарь терминов курса.',
    minutes: 5,
    has3d: false,
    component: lazy(() => import('./10-glossary')),
  },
].sort((a, b) => a.order - b.order) as SectionMeta[];

export function getSection(slug: string | undefined): SectionMeta | undefined {
  return SECTIONS.find((s) => s.slug === slug);
}

export function getSectionById(id: SectionId): SectionMeta {
  return SECTIONS.find((s) => s.id === id)!;
}

export function getPrevNext(slug: string): { prev?: SectionMeta; next?: SectionMeta } {
  const i = SECTIONS.findIndex((s) => s.slug === slug);
  return { prev: i > 0 ? SECTIONS[i - 1] : undefined, next: i >= 0 && i < SECTIONS.length - 1 ? SECTIONS[i + 1] : undefined };
}

import { createSceneStore, type TourStep } from '../store';

export const BLOCK_H = 0.7;
export const BLOCK_GAP = 0.35;
export const EXPLODED_H = 2.3;
export const BASE_Y = 1.1;

export function stackTop(layers: number, exploded: number): number {
  return BASE_Y + layers * (BLOCK_H + BLOCK_GAP) + (exploded >= 0 ? EXPLODED_H - BLOCK_H : 0) + 0.2;
}

export const TRANSFORMER_TOUR: TourStep[] = [
  {
    id: 'tokens',
    title: 'Токены → эмбеддинги',
    text: 'Внизу — токены входного текста «утром на улице идёт». Первым делом каждый номер токена превращается в вектор: это плита «Эмбеддинги». Дальше все векторы поднимаются по стеку одновременно.',
    camera: { position: [5, 2.5, 7], target: [0, 0.6, 0] },
    highlight: ['tokens', 'embed'],
    params: { layers: 6, exploded: -1 },
  },
  {
    id: 'residual',
    title: 'Остаточный поток',
    text: 'Светящийся столб в центре — остаточный поток: вектор каждого токена, который идёт снизу вверх. Каждый блок не заменяет его, а прибавляет к нему свою поправку. Частицы показывают движение информации.',
    camera: { position: [7, 5, 8], target: [0, 4, 0] },
    highlight: ['residual'],
    params: { layers: 6, exploded: -1 },
  },
  {
    id: 'block',
    title: 'Один блок = внимание + MLP',
    text: 'Раскрыли первый блок. Внутри две операции: внимание перемешивает информацию между токенами, а MLP обрабатывает каждый токен по отдельности. Перед каждой — LayerNorm, после каждой — сложение с остаточным потоком.',
    camera: { position: [4.5, 3, 5.5], target: [0, 2.2, 0] },
    highlight: ['block:0'],
    params: { layers: 6, exploded: 0 },
  },
  {
    id: 'repeat',
    title: 'Блоки повторяются N раз',
    text: 'Блоки одинаковы по устройству, но у каждого свои параметры. GPT-2 small — 12 блоков, GPT-3 — 96. Ползунком в панели можно менять число блоков: глубина растёт, а принцип остаётся тем же.',
    camera: { position: [9.5, 8, 14], target: [0, 4.9, 0] },
    highlight: [],
    params: { layers: 6, exploded: -1 },
  },
  {
    id: 'output',
    title: 'Выход: логиты → вероятности',
    text: 'На вершине вектор последнего токена умножают на выходную матрицу и получают логит для каждого слова словаря. Softmax превращает их в вероятности — столбики над стеком. Это и есть ответ модели: что будет дальше.',
    camera: { position: [4, 10.5, 5.5], target: [0, 8.2, 0] },
    highlight: ['top'],
    params: { layers: 6, exploded: -1 },
  },
];

export const transformerStore = createSceneStore({ layers: 6, exploded: -1, particles: true }, TRANSFORMER_TOUR);

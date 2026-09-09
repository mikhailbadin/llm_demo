import { createSceneStore, type TourStep } from '../store';

export const PROB_TOUR: TourStep[] = [
  {
    id: 'bars',
    title: 'Каждый столбик — кандидат',
    text: 'После префикса «кот сидит на» модель выдаёт вероятность для каждого слова словаря. Здесь показаны 20 самых вероятных: высота столбика — вероятность. Остальные 130 слов вместе не набирают и пары процентов.',
    camera: { position: [1, 7, 15.5], target: [0, 2.9, 0] },
    highlight: [],
    params: { temperature: 1, topK: 0, topP: 1, generated: '' },
  },
  {
    id: 'temperature',
    title: 'Температура',
    text: 'Поставили температуру 0,4. Логиты делятся на T перед softmax, поэтому маленькая температура «заостряет» распределение: лидер забирает почти всё. Каркасные контуры — прежние высоты при T = 1. Попробуйте T = 2 в панели, чтобы увидеть обратный эффект.',
    camera: { position: [1, 7, 15.5], target: [0, 2.9, 0] },
    highlight: [],
    params: { temperature: 0.4, topK: 0, topP: 1 },
  },
  {
    id: 'topk',
    title: 'Top-k: оставить k лучших',
    text: 'Вернули T = 1 и включили top-k = 5. Всё, что правее заслонки, отсекается и получает ноль. Вероятности оставшихся пяти перенормируются, чтобы снова давать 1 в сумме.',
    camera: { position: [-2, 6, 13.5], target: [-2, 2.9, 0] },
    highlight: [],
    params: { temperature: 1, topK: 5, topP: 1 },
  },
  {
    id: 'topp',
    title: 'Top-p: оставить «ядро»',
    text: 'Top-p = 0,8 оставляет наименьший набор слов, чья суммарная вероятность не меньше 80 %. В отличие от top-k, число оставшихся слов меняется само: где модель уверена — их мало, где сомневается — много.',
    camera: { position: [-2, 6, 13.5], target: [-2, 2.9, 0] },
    highlight: [],
    params: { temperature: 1, topK: 0, topP: 0.8 },
  },
  {
    id: 'sample',
    title: 'Сэмплируем!',
    text: 'Нажмите «Сэмплировать» в панели: шарик упадёт на случайно выбранный столбик (чем выше, тем вероятнее), слово добавится к тексту, и распределение перестроится для нового контекста. Так рождается текст — по одному слову.',
    camera: { position: [1, 7, 15.5], target: [0, 2.9, 0] },
    highlight: [],
    params: { temperature: 1, topK: 0, topP: 1 },
  },
];

export const probStore = createSceneStore({ prefix: 'кот сидит на', generated: '', temperature: 1, topK: 0, topP: 1, seed: 1, pending: '', dropNonce: 0 }, PROB_TOUR);

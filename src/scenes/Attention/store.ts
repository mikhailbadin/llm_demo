import { createSceneStore, type TourStep } from '../store';

export const ATTENTION_TOUR: TourStep[] = [
  {
    id: 'tokens',
    title: 'Токены предложения',
    text: 'Каждая сфера — токен предложения «Кот сел на коврик, потому что он устал». Внимание позволяет любому токену собрать информацию из остальных. Нажмите на сферу, чтобы сделать её «запросом».',
    camera: { position: [0, 5, 11], target: [0, 0.6, 0] },
    highlight: [],
    params: { example: 'cat', head: 1, causal: false, allHeads: false },
    select: null,
  },
  {
    id: 'query',
    title: 'Выбираем запрос: «он»',
    text: 'Для слова «он» модель как будто спрашивает: «о ком речь?». Она сравнивает свой запрос (Query) с ключами (Key) всех токенов. Дуги показывают, куда ушло внимание: толще дуга — больше вес.',
    camera: { position: [3, 4.5, 9], target: [1.5, 0.6, 0] },
    highlight: [],
    params: { example: 'cat', head: 1, causal: false, allHeads: false },
    select: 't7',
  },
  {
    id: 'softmax',
    title: 'Веса — это softmax, сумма равна 1',
    text: 'Столбики под токенами — те же веса в виде гистограммы. Они получены из оценок через softmax, поэтому в сумме дают ровно 1. Почти всё внимание «он» досталось слову «Кот»: модель поняла, кто устал.',
    camera: { position: [-2, 3.5, 8.5], target: [-2, 0.4, 0] },
    highlight: ['edge:7-0', 'bar:0', 't0', 't7'],
    params: { example: 'cat', head: 1, causal: false, allHeads: false },
    select: 't7',
  },
  {
    id: 'heads',
    title: 'Другая голова — другой паттерн',
    text: 'Переключили на первую голову. Она почти всегда смотрит на предыдущее слово: так модель улавливает порядок. В настоящем трансформере десятки таких голов работают параллельно, и каждая ищет свой тип связей.',
    camera: { position: [3, 4.5, 9], target: [1.5, 0.6, 0] },
    highlight: [],
    params: { example: 'cat', head: 0, causal: false, allHeads: false },
    select: 't7',
  },
  {
    id: 'mask',
    title: 'Маска: смотреть только назад',
    text: 'При генерации токен не может видеть будущее — ведь его ещё нет. Включили причинную маску и выбрали «коврик»: дуги к словам справа исчезли, а веса перераспределились между теми, что слева.',
    camera: { position: [-1, 4.5, 9.5], target: [-1, 0.6, 0] },
    highlight: [],
    params: { example: 'cat', head: 1, causal: true, allHeads: false },
    select: 't3',
  },
];

export const attentionStore = createSceneStore({ example: 'cat', head: 1, causal: false, allHeads: false }, ATTENTION_TOUR);

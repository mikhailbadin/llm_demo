import { createSceneStore, type TourStep } from '../store';
import { getCluster } from '@/data/embeddings';
import { add } from '@/lib/vec3';

const animals = getCluster('animals').center;
const family = getCluster('family').center;

export const EMBEDDING_TOUR: TourStep[] = [
  {
    id: 'points',
    title: 'Каждая точка — слово',
    text: 'Перед вами 84 слова. Модель хранит каждое из них как вектор чисел, а здесь мы показываем эти векторы как точки в трёхмерном пространстве. Цвет — смысловая группа.',
    camera: { position: [12, 8, 12], target: [0, 0, 0] },
    highlight: [],
    params: { mode: 'neighbors' },
    select: null,
  },
  {
    id: 'clusters',
    title: 'Похожие слова — рядом',
    text: 'Животные собрались в одном месте, еда — в другом. Никто не раскладывал их вручную: при обучении модель сама сдвигает векторы слов, которые встречаются в похожих контекстах, поближе друг к другу.',
    camera: { position: add(animals, [4.5, 3, 5]), target: animals },
    highlight: ['cluster:animals'],
    params: { mode: 'neighbors' },
    select: null,
  },
  {
    id: 'neighbors',
    title: 'Расстояние — это похожесть',
    text: 'Выбрано слово «кошка». Линии ведут к пяти ближайшим соседям по косинусной близости: чем толще линия, тем ближе слова. Нажмите на любую другую точку, чтобы увидеть её соседей.',
    camera: { position: add(animals, [3.5, 2.5, 4.5]), target: animals },
    highlight: ['cluster:animals'],
    params: { mode: 'neighbors' },
    select: 'кошка',
  },
  {
    id: 'analogy',
    title: 'Арифметика смыслов',
    text: 'Направления в этом пространстве тоже что-то значат. Стрелка от «мужчина» к «король» — это «королевскость». Приложим ту же стрелку к «женщина» — и попадём почти точно в «королева». Король − мужчина + женщина ≈ королева.',
    camera: { position: add(family, [1.5, 2.5, 6]), target: add(family, [0.6, 0.6, 0]) },
    highlight: ['cluster:family'],
    params: { mode: 'analogy', a: 'король', b: 'мужчина', c: 'женщина' },
    select: null,
  },
  {
    id: 'dims',
    title: 'На самом деле измерений сотни',
    text: 'У нас три оси, потому что больше человек не увидит. В реальных моделях у каждого токена от 768 до 16 000 чисел, и «близость» считается по всем ним сразу. Идея та же: смысл — это положение в пространстве.',
    camera: { position: [14, 9, 14], target: [0, 0, 0] },
    highlight: [],
    params: { mode: 'neighbors' },
    select: null,
  },
];

export const embeddingStore = createSceneStore({ mode: 'neighbors', a: 'король', b: 'мужчина', c: 'женщина' }, EMBEDDING_TOUR);

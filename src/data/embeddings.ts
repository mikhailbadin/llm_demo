import { createRng } from '@/lib/rng';
import { add, type Vec3 } from '@/lib/vec3';
import type { EmbeddingWord } from '@/lib/embeddings';

export type ClusterId = 'animals' | 'food' | 'places' | 'professions' | 'emotions' | 'colors' | 'transport' | 'family';

export interface Cluster {
  id: ClusterId;
  label: string;
  colorIndex: number;
  center: Vec3;
}

export const CLUSTERS: Cluster[] = [
  { id: 'animals', label: 'Животные', colorIndex: 0, center: [4.5, 0.5, 0] },
  { id: 'food', label: 'Еда', colorIndex: 2, center: [-3, 2.5, 3] },
  { id: 'places', label: 'Города и страны', colorIndex: 4, center: [0, -3.5, 3.5] },
  { id: 'professions', label: 'Профессии', colorIndex: 6, center: [-4, -1.5, -2.5] },
  { id: 'emotions', label: 'Эмоции', colorIndex: 5, center: [2.5, 3.5, -3] },
  { id: 'colors', label: 'Цвета', colorIndex: 3, center: [3, -2, -4] },
  { id: 'transport', label: 'Транспорт', colorIndex: 7, center: [-1, 4, -1] },
  { id: 'family', label: 'Семья и титулы', colorIndex: 1, center: [-2.5, -0.5, 4] },
];

const rng = createRng(42);
const jitter = (sd: number): Vec3 => [rng.gauss(0, sd), rng.gauss(0, sd), rng.gauss(0, sd)];

function cluster(id: ClusterId, words: string[], sd = 0.65): EmbeddingWord[] {
  const c = CLUSTERS.find((x) => x.id === id)!;
  return words.map((word) => ({ id: word.toLowerCase(), word, cluster: id, pos: add(c.center, jitter(sd)) }));
}

/** Кластер «семья и титулы» построен явно, чтобы работала арифметика: король − мужчина + женщина = королева. */
function familyCluster(): EmbeddingWord[] {
  const c = CLUSTERS.find((x) => x.id === 'family')!.center;
  const g: Vec3 = [1.2, 0.3, 0]; // «женский» сдвиг
  const r: Vec3 = [0, 1.4, 0.6]; // «королевский» сдвиг
  const young: Vec3 = [0.6, -1.0, 0.2];
  const parent: Vec3 = [-0.8, -0.6, 0.6];
  const sibling: Vec3 = [-0.3, 0.2, -1.0];
  const artist: Vec3 = [0.9, 0.8, -0.9];
  const pairs: [string, string, Vec3][] = [
    ['мужчина', 'женщина', [0, 0, 0]],
    ['король', 'королева', r],
    ['принц', 'принцесса', add(r, young)],
    ['отец', 'мать', parent],
    ['сын', 'дочь', young],
    ['брат', 'сестра', sibling],
    ['актёр', 'актриса', artist],
  ];
  const out: EmbeddingWord[] = [];
  for (const [m, f, off] of pairs) {
    const base = add(add(c, off), jitter(0.04));
    out.push({ id: m, word: m, cluster: 'family', pos: base });
    out.push({ id: f, word: f, cluster: 'family', pos: add(add(base, g), jitter(0.04)) });
  }
  return out;
}

/** Страны + города на одной «оси столицы», чтобы работало Париж − Франция + Италия ≈ Рим. */
function placesCluster(): EmbeddingWord[] {
  const c = CLUSTERS.find((x) => x.id === 'places')!.center;
  const cityAxis: Vec3 = [0.9, 0.7, -0.5];
  const pairs: [string, string][] = [
    ['Россия', 'Москва'],
    ['Франция', 'Париж'],
    ['Германия', 'Берлин'],
    ['Италия', 'Рим'],
    ['Япония', 'Токио'],
  ];
  const out: EmbeddingWord[] = [];
  for (const [country, city] of pairs) {
    const base = add(c, jitter(0.5));
    out.push({ id: country.toLowerCase(), word: country, cluster: 'places', pos: base });
    out.push({ id: city.toLowerCase(), word: city, cluster: 'places', pos: add(add(base, cityAxis), jitter(0.04)) });
  }
  return out;
}

export const EMBEDDING_WORDS: EmbeddingWord[] = [
  ...cluster('animals', ['кошка', 'собака', 'лошадь', 'корова', 'волк', 'лиса', 'заяц', 'медведь', 'мышь', 'птица']),
  ...cluster('food', ['хлеб', 'сыр', 'яблоко', 'суп', 'каша', 'мясо', 'рыба', 'молоко', 'пирог', 'чай']),
  ...placesCluster(),
  ...cluster('professions', ['врач', 'учитель', 'инженер', 'повар', 'водитель', 'художник', 'программист', 'юрист', 'пилот', 'музыкант']),
  ...cluster('emotions', ['радость', 'грусть', 'страх', 'гнев', 'удивление', 'спокойствие', 'любовь', 'скука', 'восторг', 'тревога']),
  ...cluster('colors', ['красный', 'синий', 'зелёный', 'жёлтый', 'белый', 'чёрный', 'серый', 'оранжевый', 'фиолетовый', 'розовый']),
  ...cluster('transport', ['машина', 'автобус', 'поезд', 'самолёт', 'велосипед', 'корабль', 'трамвай', 'метро', 'такси', 'мотоцикл']),
  ...familyCluster(),
];

export const ANALOGY_PRESETS: { a: string; b: string; c: string; label: string }[] = [
  { a: 'король', b: 'мужчина', c: 'женщина', label: 'король − мужчина + женщина' },
  { a: 'париж', b: 'франция', c: 'италия', label: 'Париж − Франция + Италия' },
  { a: 'отец', b: 'мужчина', c: 'женщина', label: 'отец − мужчина + женщина' },
  { a: 'принцесса', b: 'женщина', c: 'мужчина', label: 'принцесса − женщина + мужчина' },
];

export function getWord(id: string): EmbeddingWord {
  return EMBEDDING_WORDS.find((w) => w.id === id)!;
}

export function getCluster(id: ClusterId): Cluster {
  return CLUSTERS.find((c) => c.id === id)!;
}

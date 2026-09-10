import { createSceneStore, type TourStep } from '../store';
import { lossGradient, lossSurface } from '@/lib/landscape';

export const Y_SCALE = 0.7;

export const LOSS_TOUR: TourStep[] = [
  {
    id: 'surface',
    title: 'Поверхность — это потери',
    text: 'Представьте, что у модели всего два параметра. Для каждой их пары можно посчитать, насколько модель ошибается: это высота поверхности. Синие низины — хорошие параметры, жёлтые холмы — плохие. У настоящих моделей параметров миллиарды, но картина по сути та же.',
    camera: { position: [10, 8, 10], target: [0, 1.5, 0] },
    highlight: [],
    params: { auto: false },
  },
  {
    id: 'ball',
    title: 'Шарик — текущие параметры',
    text: 'В начале обучения параметры случайны — шарик стоит где-то на склоне. Мы поставили его в точку (3; 3). Нажмите в любое место поверхности, чтобы перенести шарик.',
    camera: { position: [6.5, 5, 7.5], target: [3, 2, 3] },
    highlight: [],
    params: { bx: 3, bz: 3, vx: 0, vz: 0, trail: '[[3,3]]', lr: 0.15, momentum: false, auto: false, burst: 0, showGrad: true },
  },
  {
    id: 'gradient',
    title: 'Против градиента',
    text: 'Стрелка — направление, в котором потери уменьшаются быстрее всего (минус градиент). Один шаг обучения — сдвинуть параметры вдоль стрелки. Мы сделали три шага; нажмите «Шаг» или «Авто», чтобы продолжить спуск.',
    camera: { position: [6.5, 5, 7.5], target: [3, 2, 3] },
    highlight: [],
    params: { bx: 3, bz: 3, vx: 0, vz: 0, trail: '[[3,3]]', lr: 0.15, momentum: false, burst: 3, auto: false },
  },
  {
    id: 'lr',
    title: 'Скорость обучения',
    text: 'Длина шага — скорость обучения (learning rate). Поставили максимальные 0,8: шарик проскакивает мимо дна и раскачивается по склонам, вместо того чтобы аккуратно спуститься. Слишком маленький шаг — обучение ползёт вечность, слишком большой — расходится.',
    camera: { position: [7, 7, 8], target: [1.5, 1.5, 1] },
    highlight: [],
    params: { bx: 3, bz: 3, vx: 0, vz: 0, trail: '[[3,3]]', lr: 0.8, momentum: false, burst: 10, auto: false },
  },
  {
    id: 'minima',
    title: 'Локальные минимумы',
    text: 'На поверхности две ямы, и градиентный спуск попадёт в ту, к которой скатится: он видит только склон под ногами. Отсюда шарик за 26 шагов пришёл в мелкую яму. Включите «Момент (инерция)» и поставьте η = 0,4, затем «Сброс шарика» и «Авто»: с разгона он перескочит гребень и доедет до глубокой. В миллиардах измерений локальные минимумы — меньшая проблема, чем кажется, но инерция и удачная скорость обучения важны именно поэтому.',
    camera: { position: [-6, 6, 8], target: [-1, 1.5, -1] },
    highlight: [],
    params: { bx: -0.8, bz: -3.5, vx: 0, vz: 0, trail: '[[-0.8,-3.5]]', lr: 0.2, momentum: false, burst: 26, auto: false },
  },
];

export const lossStore = createSceneStore({ bx: 3, bz: 3, vx: 0, vz: 0, trail: '[[3,3]]', lr: 0.15, momentum: false, showGrad: true, auto: false, burst: 0 }, LOSS_TOUR);

export function parseTrail(s: string): [number, number][] {
  try {
    return JSON.parse(s) as [number, number][];
  } catch {
    return [];
  }
}

const clamp = (v: number) => Math.max(-4.9, Math.min(4.9, v));

/** Один шаг градиентного спуска по текущему состоянию стора. */
export function descentStep() {
  const s = lossStore.getState();
  const p = s.params;
  const x = p.bx as number;
  const z = p.bz as number;
  const lr = p.lr as number;
  const [gx, gz] = lossGradient(x, z);
  let vx = p.vx as number;
  let vz = p.vz as number;
  if (p.momentum) {
    vx = 0.8 * vx - lr * gx;
    vz = 0.8 * vz - lr * gz;
  } else {
    vx = -lr * gx;
    vz = -lr * gz;
  }
  const nx = clamp(x + vx);
  const nz = clamp(z + vz);
  const trail = parseTrail(p.trail as string);
  trail.push([nx, nz]);
  if (trail.length > 200) trail.shift();
  s.setParams({ bx: nx, bz: nz, vx, vz, trail: JSON.stringify(trail) });
}

/** Ставит шарик в точку и начинает след с неё; таймеры «Авто» и серии шагов останавливаются. */
export function placeBall(x: number, z: number) {
  const cx = clamp(x);
  const cz = clamp(z);
  lossStore.getState().setParams({ bx: cx, bz: cz, vx: 0, vz: 0, trail: JSON.stringify([[cx, cz]]), auto: false, burst: 0 });
}

/** Полный сброс панели: шарик в (3; 3), исходные η, момент и стрелка градиента. */
export function resetDescent() {
  const st = lossStore.getState();
  st.setParams({ ...st.initialParams });
}

export function currentLoss(): number {
  const p = lossStore.getState().params;
  return lossSurface(p.bx as number, p.bz as number);
}

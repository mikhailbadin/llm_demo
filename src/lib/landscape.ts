/** Игрушечный «ландшафт потерь» по двум параметрам: чаша + две ямы + рябь. */
export function lossSurface(x: number, y: number): number {
  const bowl = 0.12 * (x * x + y * y);
  const pit1 = -2.0 * Math.exp(-((x - 1.5) ** 2 + (y - 1) ** 2) / 1.5);
  const pit2 = -1.2 * Math.exp(-((x + 2) ** 2 + (y + 2) ** 2) / 2);
  const ripple = 0.35 * Math.sin(1.5 * x) * Math.cos(1.5 * y);
  return bowl + pit1 + pit2 + ripple + 2.2;
}

export function lossGradient(x: number, y: number): [number, number] {
  const e1 = Math.exp(-((x - 1.5) ** 2 + (y - 1) ** 2) / 1.5);
  const e2 = Math.exp(-((x + 2) ** 2 + (y + 2) ** 2) / 2);
  const dx = 0.24 * x + (2.0 * e1 * (2 * (x - 1.5))) / 1.5 + (1.2 * e2 * (2 * (x + 2))) / 2 + 0.35 * 1.5 * Math.cos(1.5 * x) * Math.cos(1.5 * y);
  const dy = 0.24 * y + (2.0 * e1 * (2 * (y - 1))) / 1.5 + (1.2 * e2 * (2 * (y + 2))) / 2 - 0.35 * 1.5 * Math.sin(1.5 * x) * Math.sin(1.5 * y);
  return [dx, dy];
}

/** Одномерная функция потерь для виджета градиентного спуска: невыпуклая, с двумя минимумами. */
export function loss1d(w: number): number {
  return 0.08 * w ** 4 - 0.5 * w ** 2 + 0.25 * w + 1.4;
}
export function loss1dGrad(w: number): number {
  return 0.32 * w ** 3 - w + 0.25;
}

import { useEffect } from 'react';
import { descentStep, lossStore } from '@/scenes/LossSurface/store';

/**
 * Таймеры спуска («Авто» и серии шагов из экскурсии) — в компоненте без разметки, который смонтирован всегда.
 * В панели управления им не место: на узких экранах панель свёрнута и размонтирована.
 */
export function LossDriver() {
  const auto = lossStore((s) => s.params.auto as boolean);
  const burst = lossStore((s) => s.params.burst as number);

  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(descentStep, 260);
    return () => window.clearInterval(id);
  }, [auto]);

  useEffect(() => {
    if (!burst) return;
    let i = 0;
    const id = window.setInterval(() => {
      descentStep();
      if (++i >= burst) {
        window.clearInterval(id);
        lossStore.getState().setParam('burst', 0);
      }
    }, 300);
    return () => window.clearInterval(id);
  }, [burst]);

  return null;
}

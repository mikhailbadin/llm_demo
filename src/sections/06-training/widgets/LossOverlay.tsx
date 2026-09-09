import { useEffect } from 'react';
import { Button, Slider, Toggle } from '@/components/ui';
import { descentStep, lossStore, placeBall, currentLoss } from '@/scenes/LossSurface/store';
import { fmtFixed } from '@/lib/format';

export function LossOverlay() {
  const lr = lossStore((s) => s.params.lr as number);
  const momentum = lossStore((s) => s.params.momentum as boolean);
  const showGrad = lossStore((s) => s.params.showGrad as boolean);
  const auto = lossStore((s) => s.params.auto as boolean);
  const burst = lossStore((s) => s.params.burst as number);
  const bx = lossStore((s) => s.params.bx as number);
  const bz = lossStore((s) => s.params.bz as number);
  const st = lossStore.getState();

  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(descentStep, 260);
    return () => window.clearInterval(id);
  }, [auto]);

  // «burst» — серия шагов, запускаемая шагом экскурсии
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

  return (
    <>
      <Slider label="Скорость обучения η" value={lr} min={0.02} max={0.8} step={0.02} onChange={(v) => st.setParam('lr', v)} format={(v) => fmtFixed(v, 2)} />
      <div className="btn-row">
        <Button size="sm" variant="primary" onClick={descentStep} disabled={auto}>
          Шаг
        </Button>
        <Button size="sm" onClick={() => st.setParam('auto', !auto)}>
          {auto ? '⏸ Стоп' : '▶ Авто'}
        </Button>
        <Button size="sm" onClick={() => placeBall(3, 3)}>
          Сброс
        </Button>
      </div>
      <Toggle label="Момент (инерция)" checked={momentum} onChange={(v) => st.setParam('momentum', v)} />
      <Toggle label="Показывать градиент" checked={showGrad} onChange={(v) => st.setParam('showGrad', v)} />
      <div className="small muted">
        Параметры: ({fmtFixed(bx, 2)}; {fmtFixed(bz, 2)}), loss = {fmtFixed(currentLoss(), 3)}. Нажмите на поверхность, чтобы поставить шарик.
      </div>
    </>
  );
}

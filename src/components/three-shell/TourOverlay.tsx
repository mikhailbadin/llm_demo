import { Button } from '@/components/ui/Button';
import type { SceneStore } from '@/scenes/store';

export function TourOverlay({ store }: { store: SceneStore }) {
  const step = store((s) => s.tourStep);
  const tour = store((s) => s.tour);
  if (step === null) return null;
  const current = tour[step];
  const last = step >= tour.length - 1;
  return (
    <div className="tour" role="dialog" aria-label="Экскурсия по сцене">
      <div className="tour__head">
        <span className="tour__step">
          Шаг {step + 1} / {tour.length}
        </span>
        <span className="tour__title">{current.title}</span>
        <button type="button" className="btn btn--ghost btn--icon" aria-label="Закрыть экскурсию" onClick={() => store.getState().endTour()}>
          ✕
        </button>
      </div>
      <p className="tour__text" aria-live="polite">
        {current.text}
      </p>
      <div className="tour__foot">
        <Button size="sm" onClick={() => store.getState().prevStep()} disabled={step === 0}>
          ← Назад
        </Button>
        <div className="stepper__dots" aria-hidden="true">
          {tour.map((t, i) => (
            <button key={t.id} type="button" className={`stepper__dot${i === step ? ' is-active' : i < step ? ' is-done' : ''}`} onClick={() => store.getState().goToStep(i)} tabIndex={-1} />
          ))}
        </div>
        <span className="tour__kbd">← → на клавиатуре</span>
        <Button size="sm" variant="primary" onClick={() => store.getState().nextStep()}>
          {last ? 'Завершить' : 'Далее →'}
        </Button>
      </div>
    </div>
  );
}

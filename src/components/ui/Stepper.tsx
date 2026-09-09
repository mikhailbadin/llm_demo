import { Button } from './Button';

interface Props {
  step: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect?: (i: number) => void;
  prevLabel?: string;
  nextLabel?: string;
  compact?: boolean;
}

export function Stepper({ step, total, onPrev, onNext, onSelect, prevLabel = '← Назад', nextLabel = 'Далее →', compact }: Props) {
  return (
    <div className="stepper">
      <Button size="sm" onClick={onPrev} disabled={step <= 0}>
        {compact ? '←' : prevLabel}
      </Button>
      <div className="stepper__dots" aria-hidden={!onSelect}>
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`stepper__dot${i === step ? ' is-active' : i < step ? ' is-done' : ''}`}
            onClick={() => onSelect?.(i)}
            aria-label={`Шаг ${i + 1}`}
            tabIndex={onSelect ? 0 : -1}
          />
        ))}
      </div>
      <span className="stepper__count">
        {step + 1} / {total}
      </span>
      <Button size="sm" onClick={onNext} disabled={step >= total - 1}>
        {compact ? '→' : nextLabel}
      </Button>
    </div>
  );
}

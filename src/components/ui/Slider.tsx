import { useId, type ReactNode } from 'react';

interface Props {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  disabled?: boolean;
  hint?: ReactNode;
}

export function Slider({ label, value, min, max, step = 1, onChange, format, disabled, hint }: Props) {
  const id = useId();
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        <span>
          {label}
          {hint && <span className="muted"> {hint}</span>}
        </span>
        <span className="field__value">{format ? format(value) : value}</span>
      </label>
      <input
        id={id}
        className="slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

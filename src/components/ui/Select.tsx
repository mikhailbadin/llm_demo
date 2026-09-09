import { useId, type ReactNode } from 'react';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  label?: ReactNode;
  value: T;
  options: readonly Option<T>[];
  onChange: (v: T) => void;
  disabled?: boolean;
}

export function Select<T extends string>({ label, value, options, onChange, disabled }: Props<T>) {
  const id = useId();
  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={id}>
          <span>{label}</span>
        </label>
      )}
      <select id={id} className="select" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

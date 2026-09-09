import type { ReactNode } from 'react';

export type CalloutKind = 'hint' | 'info' | 'warning' | 'try' | 'formula';

const DEFAULTS: Record<CalloutKind, { title: string; icon: string }> = {
  hint: { title: 'Подсказка', icon: '💡' },
  info: { title: 'Обратите внимание', icon: 'ℹ️' },
  warning: { title: 'Важно', icon: '⚠️' },
  try: { title: 'Попробуйте', icon: '🎛️' },
  formula: { title: 'Формула', icon: '∑' },
};

export function Callout({ kind = 'hint', title, children }: { kind?: CalloutKind; title?: string; children: ReactNode }) {
  const d = DEFAULTS[kind];
  return (
    <aside className={`callout callout--${kind}`}>
      <div className="callout__icon" aria-hidden="true">
        {d.icon}
      </div>
      <div className="callout__body">
        <div className="callout__title">{title ?? d.title}</div>
        {typeof children === 'string' ? <p>{children}</p> : children}
      </div>
    </aside>
  );
}

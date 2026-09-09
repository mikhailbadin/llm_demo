import * as Tooltip from '@radix-ui/react-tooltip';
import * as Popover from '@radix-ui/react-popover';
import type { ReactNode } from 'react';

export function IconTooltip({ label, children, side = 'top' }: { label: ReactNode; children: ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="tooltip" sideOffset={6} side={side} collisionPadding={8}>
            {label}
            <Tooltip.Arrow className="popover__arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

/** Кнопка «?» с поповером — работает и по клику, и на touch-устройствах. */
export function HelpButton({ children, label = 'Что здесь можно делать' }: { children: ReactNode; label?: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" className="btn btn--ghost btn--icon" aria-label={label} title={label}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" />
          </svg>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="popover" sideOffset={6} collisionPadding={12} align="end">
          <div className="popover__title">{label}</div>
          <div>{children}</div>
          <Popover.Arrow className="popover__arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

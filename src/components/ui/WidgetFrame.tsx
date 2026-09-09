import type { ReactNode } from 'react';
import { HelpButton } from './IconTooltip';
import { Button } from './Button';

interface Props {
  title: string;
  icon?: string;
  help?: ReactNode;
  onReset?: () => void;
  note?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}

/** Единая рамка для интерактивных виджетов: заголовок, «?» с подсказкой, сброс. */
export function WidgetFrame({ title, icon = '🎛️', help, onReset, note, children, actions }: Props) {
  return (
    <section className="widget" aria-label={title}>
      <header className="widget__head">
        <span className="widget__icon" aria-hidden="true">
          {icon}
        </span>
        <span className="widget__title">{title}</span>
        {actions}
        {onReset && (
          <Button size="sm" variant="ghost" onClick={onReset} title="Вернуть значения по умолчанию">
            Сбросить
          </Button>
        )}
        {help && <HelpButton>{help}</HelpButton>}
      </header>
      <div className="widget__body">{children}</div>
      {note && <div className="widget__foot">{typeof note === 'string' ? <p>{note}</p> : note}</div>}
    </section>
  );
}

/** Одноразовая подсказка рядом с главным контролом: исчезает после первого взаимодействия. */
export function CoachMark({ show, children }: { show: boolean; children: ReactNode }) {
  if (!show) return null;
  return (
    <span className="coach" role="status">
      <span aria-hidden="true">👆</span> {children}
    </span>
  );
}

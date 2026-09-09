import * as Popover from '@radix-ui/react-popover';
import { useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GLOSSARY, type TermId } from '@/data/glossary';
import { getSectionById } from '@/sections/registry';
import { useIsTouch } from '@/hooks/useMediaQuery';

export function Term({ id, children }: { id: TermId; children?: ReactNode }) {
  const entry = GLOSSARY[id];
  const [open, setOpen] = useState(false);
  const isTouch = useIsTouch();
  const timer = useRef<number | null>(null);

  const clear = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };
  const hoverProps = isTouch
    ? {}
    : {
        onMouseEnter: () => {
          clear();
          timer.current = window.setTimeout(() => setOpen(true), 150);
        },
        onMouseLeave: () => {
          clear();
          timer.current = window.setTimeout(() => setOpen(false), 220);
        },
      };
  const { pathname } = useLocation();
  const target = entry.section ? getSectionById(entry.section) : undefined;
  // Ссылку «Подробнее» показываем, только если она ведёт в другой раздел.
  const section = target && pathname !== `/${target.slug}` ? target : undefined;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" className="term" {...hoverProps}>
          {children ?? entry.term}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="popover"
          sideOffset={6}
          collisionPadding={12}
          onOpenAutoFocus={(e) => e.preventDefault()}
          {...hoverProps}
        >
          <div className="popover__title">{entry.term}</div>
          <div>{entry.short}</div>
          {section && (
            <Link className="popover__link" to={`/${section.slug}`} onClick={() => setOpen(false)}>
              Подробнее → раздел {section.order}. {section.shortTitle}
            </Link>
          )}
          <Popover.Arrow className="popover__arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

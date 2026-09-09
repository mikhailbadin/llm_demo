import type { ReactNode } from 'react';
import { getSectionById } from '@/sections/registry';
import type { SectionId } from '@/sections/types';

/** Заголовок раздела: номер, название, лид и список «что вы узнаете». */
export function SectionHero({ id, lead, learn }: { id: SectionId; lead?: ReactNode; learn: string[] }) {
  const s = getSectionById(id);
  return (
    <header className="section-hero">
      <div className="eyebrow">
        Раздел {s.order} · ~{s.minutes} мин{s.has3d ? ' · есть 3D-сцена' : ''}
      </div>
      <h1>{s.title}</h1>
      <p className="lead">{lead ?? s.description}</p>
      <ul className="learn-list" aria-label="Что вы узнаете">
        {learn.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </header>
  );
}

export function Summary({ children }: { children: ReactNode }) {
  return (
    <section className="summary">
      <h2>Итог раздела</h2>
      {children}
    </section>
  );
}

export function H2({ id, children }: { id?: string; children: ReactNode }) {
  return <h2 id={id}>{children}</h2>;
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="table-wrap">{children}</div>;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="chip chip--muted chip--sm">{children}</kbd>;
}

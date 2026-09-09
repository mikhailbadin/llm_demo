import { Link } from 'react-router-dom';
import { getPrevNext } from '@/sections/registry';

export function SectionFooterNav({ slug }: { slug: string }) {
  const { prev, next } = getPrevNext(slug);
  return (
    <nav className="footnav" aria-label="Соседние разделы">
      {prev ? (
        <Link to={`/${prev.slug}`} className="footnav__card">
          <span className="footnav__label">← Предыдущий</span>
          <span className="footnav__title">{prev.order}. {prev.shortTitle}</span>
        </Link>
      ) : (
        <Link to="/" className="footnav__card">
          <span className="footnav__label">← Главная</span>
          <span className="footnav__title">Обзор курса</span>
        </Link>
      )}
      {next ? (
        <Link to={`/${next.slug}`} className="footnav__card is-next">
          <span className="footnav__label">Следующий →</span>
          <span className="footnav__title">{next.order}. {next.shortTitle}</span>
        </Link>
      ) : (
        <div className="footnav__card footnav__empty" aria-hidden="true" />
      )}
    </nav>
  );
}

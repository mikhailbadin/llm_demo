import { Link, useParams } from 'react-router-dom';
import { SECTIONS, getSection } from '@/sections/registry';

interface Props {
  menuOpen: boolean;
  onToggleMenu: () => void;
}

export function Header({ menuOpen, onToggleMenu }: Props) {
  const { slug } = useParams();
  const section = getSection(slug);
  return (
    <header className="header">
      <button
        className="header__menu"
        type="button"
        aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
        aria-expanded={menuOpen}
        onClick={onToggleMenu}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      <Link to="/" className="header__brand">
        <img className="header__logo" src="/favicon.svg" alt="" width={26} height={26} />
        <span>Как работают LLM</span>
      </Link>
      <div className="header__spacer" />
      {section && (
        <div className="header__progress" aria-label={`Раздел ${section.order} из ${SECTIONS.length}`}>
          Раздел {section.order} / {SECTIONS.length}
        </div>
      )}
    </header>
  );
}

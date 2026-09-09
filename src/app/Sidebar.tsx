import { NavLink } from 'react-router-dom';
import { SECTIONS } from '@/sections/registry';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: Props) {
  return (
    <>
      <div className={`sidebar__backdrop${open ? ' is-open' : ''}`} onClick={onClose} aria-hidden="true" />
      <nav className={`sidebar${open ? ' is-open' : ''}`} aria-label="Разделы курса">
        <div className="sidebar__home">
          <NavLink to="/" end onClick={onClose} className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}>
            <span className="sidebar__num">⌂</span>
            <span>Главная</span>
          </NavLink>
        </div>
        <div className="sidebar__title">Разделы</div>
        <ul className="sidebar__list">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <NavLink to={`/${s.slug}`} onClick={onClose} className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}>
                <span className="sidebar__num">{s.order}</span>
                <span>
                  {s.shortTitle}
                  {s.has3d && (
                    <span className="muted" style={{ fontSize: 11, marginLeft: 6 }} title="В разделе есть 3D-сцена">
                      3D
                    </span>
                  )}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SECTIONS } from '@/sections/registry';

export function HomePage() {
  useEffect(() => {
    document.title = 'Как работают LLM — интерактивный курс';
  }, []);
  const total = SECTIONS.reduce((s, x) => s + x.minutes, 0);
  return (
    <div className="prose">
      <section className="home-hero">
        <div className="eyebrow">Интерактивный курс</div>
        <h1>
          Как работают <span>большие языковые модели</span>
        </h1>
        <p>
          От токенов и эмбеддингов до внимания, обучения и генерации текста. Каждый раздел — это текст с подсказками,
          интерактивные виджеты, которые можно крутить руками, и 3D-сцены с пошаговой экскурсией.
        </p>
        <div className="btn-row">
          <Link to="/intro" className="btn btn--primary">
            Начать с первого раздела →
          </Link>
          <span className="kicker">{SECTIONS.length} разделов · примерно {total} минут</span>
        </div>
      </section>

      <div className="home-features">
        <div className="home-feature">
          <strong>Интерактив вместо картинок</strong>
          Ползунки, поля ввода и кнопки в каждом разделе. Меняйте параметры и смотрите, что происходит.
        </div>
        <div className="home-feature">
          <strong>3D-визуализации</strong>
          Пространство эмбеддингов, дуги внимания, стек трансформера, ландшафт потерь и распределение токенов.
        </div>
        <div className="home-feature">
          <strong>Подсказки по ходу</strong>
          Термины с пояснениями по наведению, блоки «Попробуйте» и экскурсии внутри 3D-сцен.
        </div>
        <div className="home-feature">
          <strong>Без чёрных ящиков</strong>
          Все демонстрации считаются прямо в браузере на маленьких игрушечных моделях, которые можно понять целиком.
        </div>
      </div>

      <h2 style={{ marginTop: 0 }}>Программа</h2>
      <div className="home-grid">
        {SECTIONS.map((s) => (
          <Link key={s.id} to={`/${s.slug}`} className="home-card">
            <span className="home-card__num">РАЗДЕЛ {s.order}</span>
            <span className="home-card__title">{s.title}</span>
            <span className="home-card__desc">{s.description}</span>
            <span className="row" style={{ marginTop: 'auto', gap: 8 }}>
              {s.has3d && <span className="home-card__badge" style={{ marginTop: 0 }}>3D-сцена</span>}
              <span className="kicker">~{s.minutes} мин</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

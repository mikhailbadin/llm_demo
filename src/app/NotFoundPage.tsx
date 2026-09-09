import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  useEffect(() => {
    document.title = 'Страница не найдена — Как работают LLM';
  }, []);
  return (
    <div className="prose">
      <div className="eyebrow">404</div>
      <h1>Такого раздела нет</h1>
      <p className="lead">Возможно, ссылка устарела. Вернитесь на главную и выберите раздел из списка.</p>
      <Link to="/" className="btn btn--primary">
        На главную
      </Link>
    </div>
  );
}

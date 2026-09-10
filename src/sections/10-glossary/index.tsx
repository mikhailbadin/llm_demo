import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionHero, Summary } from '@/components/ui';
import { GLOSSARY, type TermId } from '@/data/glossary';
import { SECTIONS, getSectionById } from '@/sections/registry';
import { theme } from '@/styles/theme';

/** Поиск не различает «ё» и «е». */
const fold = (s: string) => s.toLowerCase().replace(/ё/g, 'е');
const FLOW: { id: string; title: string; slug: string; sub: string }[] = [
  { id: 'text', title: 'Текст', slug: 'tokenization', sub: 'токенизация' },
  { id: 'ids', title: 'Номера токенов', slug: 'embeddings', sub: 'таблица E' },
  { id: 'vec', title: 'Векторы', slug: 'transformer', sub: '+ позиция' },
  { id: 'blocks', title: 'L блоков', slug: 'attention', sub: 'внимание + MLP' },
  { id: 'logits', title: 'Логиты', slug: 'sampling', sub: 'softmax, T, top-p' },
  { id: 'token', title: 'Следующий токен', slug: 'intro', sub: '→ снова в текст' },
];

export default function GlossarySection() {
  const [q, setQ] = useState('');
  const entries = useMemo(() => {
    const ids = Object.keys(GLOSSARY) as TermId[];
    const needle = fold(q.trim());
    return ids
      .map((id) => ({ id, ...GLOSSARY[id] }))
      .filter((e) => !needle || fold(e.term).includes(needle) || fold(e.short).includes(needle))
      .sort((a, b) => {
        const oa = a.section ? getSectionById(a.section).order : 99;
        const ob = b.section ? getSectionById(b.section).order : 99;
        return oa - ob || a.term.localeCompare(b.term, 'ru');
      });
  }, [q]);

  return (
    <>
      <SectionHero id="glossary" learn={['Как разделы курса складываются в один конвейер', 'Все термины курса в одном месте, с ссылками на разделы']} />

      <h2>Как всё связано</h2>
      <p>Один запрос к модели проходит такой путь, и каждый шаг — отдельный раздел курса. Обучение (раздел 6) и дообучение (раздел 8) определяют, какими будут параметры на этом пути.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'stretch', margin: '16px 0 28px' }}>
        {FLOW.map((f, i) => (
          <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link to={`/${f.slug}`} className="card" style={{ padding: '10px 14px', minWidth: 130, color: theme.text }}>
              <div style={{ fontWeight: 600, color: theme.text }}>{f.title}</div>
              <div className="small muted">{f.sub}</div>
            </Link>
            {i < FLOW.length - 1 && <span style={{ color: theme.muted2, fontSize: 20 }}>→</span>}
          </div>
        ))}
      </div>

      <h2>Глоссарий</h2>
      <div className="field" style={{ marginBottom: 16 }}>
        <input className="input" placeholder="Поиск по терминам…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Поиск по глоссарию" />
      </div>
      <div className="glossary-list">
        {entries.map((e) => {
          const s = e.section ? getSectionById(e.section) : undefined;
          return (
            <div key={e.id} className="glossary-item" id={`term-${e.id}`}>
              <div className="glossary-item__term">
                {e.term}
                {s && (
                  <Link to={`/${s.slug}`} className="small" style={{ fontWeight: 400 }}>
                    → раздел {s.order}. {s.shortTitle}
                  </Link>
                )}
              </div>
              <div className="glossary-item__def">{e.short}</div>
            </div>
          );
        })}
        {entries.length === 0 && <p className="muted">Ничего не найдено.</p>}
      </div>

      <Summary>
        <ul>
          <li>LLM — предсказатель следующего токена; всё остальное надстроено над этим.</li>
          <li>Токены → эмбеддинги → внимание и MLP в L блоках → логиты → softmax → выбор — и так по кругу.</li>
          <li>Обучение задаёт параметры, дообучение — характер, а промпт — контекст. Дальше всё решает статистика.</li>
        </ul>
        <p className="small muted" style={{ margin: '12px 0 0' }}>
          Курс состоит из {SECTIONS.length} разделов. Спасибо, что дочитали до конца!
        </p>
      </Summary>
    </>
  );
}

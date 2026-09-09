import { Suspense, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSection } from '@/sections/registry';
import { NotFoundPage } from './NotFoundPage';
import { SectionFooterNav } from './SectionFooterNav';

function PageSkeleton() {
  return (
    <div className="prose" aria-busy="true">
      <div style={{ height: 32, width: '60%', background: 'var(--surface)', borderRadius: 8, marginBottom: 16 }} />
      <div style={{ height: 16, width: '90%', background: 'var(--surface)', borderRadius: 6, marginBottom: 10 }} />
      <div style={{ height: 16, width: '80%', background: 'var(--surface)', borderRadius: 6 }} />
    </div>
  );
}

export function SectionPage() {
  const { slug } = useParams();
  const section = getSection(slug);

  useEffect(() => {
    if (!section) return;
    document.title = `${section.order}. ${section.title} — Как работают LLM`;
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [section]);

  if (!section) return <NotFoundPage />;
  const Component = section.component;

  return (
    <article className="prose" key={section.id}>
      <Suspense fallback={<PageSkeleton />}>
        <Component />
      </Suspense>
      <SectionFooterNav slug={section.slug} />
    </article>
  );
}

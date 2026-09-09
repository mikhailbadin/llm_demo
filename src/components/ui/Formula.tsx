import katex from 'katex';
import { useMemo, type ReactNode } from 'react';

interface Props {
  tex: string;
  display?: boolean;
  caption?: ReactNode;
}

function render(tex: string, display: boolean): string {
  return katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'html' });
}

/** Блочная формула с подписью. */
export function Formula({ tex, display = true, caption }: Props) {
  const html = useMemo(() => render(tex, display), [tex, display]);
  if (!display) return <span className="formula formula--inline" dangerouslySetInnerHTML={{ __html: html }} />;
  return (
    <div className="formula">
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {caption && <div className="formula__caption">{caption}</div>}
    </div>
  );
}

/** Инлайн-формула внутри текста. */
export function M({ tex }: { tex: string }) {
  const html = useMemo(() => render(tex, false), [tex]);
  return <span className="formula formula--inline" dangerouslySetInnerHTML={{ __html: html }} />;
}

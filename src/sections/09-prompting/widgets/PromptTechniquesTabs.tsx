import { useState, type ReactNode } from 'react';
import { Tabs, WidgetFrame } from '@/components/ui';
import { PROMPT_TECHNIQUES } from '@/data/chatTemplate';

function highlight(text: string, phrases: string[]): ReactNode[] {
  if (!phrases.length) return [text];
  const re = new RegExp(`(${phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  return text.split(re).map((part, i) => (phrases.includes(part) ? <mark key={i} className="hl-user" style={{ color: 'inherit', padding: '0 2px' }}>{part}</mark> : <span key={i}>{part}</span>));
}

export function PromptTechniquesTabs() {
  const [id, setId] = useState<(typeof PROMPT_TECHNIQUES)[number]['id']>('zero');
  const t = PROMPT_TECHNIQUES.find((x) => x.id === id)!;
  return (
    <WidgetFrame title="Четыре приёма промптинга" icon="🧰" note={t.why}>
      <Tabs tabs={PROMPT_TECHNIQUES.map((x) => ({ id: x.id, label: x.label }))} value={id} onChange={setId} />
      <div style={{ fontWeight: 600, color: 'var(--text-strong)', marginBottom: 8 }}>{t.title}</div>
      <pre className="pre" style={{ fontFamily: 'var(--font)', fontSize: 14.5 }}>
        {highlight(t.prompt, t.highlight)}
      </pre>
    </WidgetFrame>
  );
}

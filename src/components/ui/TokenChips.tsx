import type { ReactNode } from 'react';

export interface ChipToken {
  text: string;
  id?: number | string;
  color?: number;
  muted?: boolean;
  highlight?: boolean;
  title?: string;
}

interface Props {
  tokens: ChipToken[];
  size?: 'md' | 'sm';
  showIds?: boolean;
  onHover?: (i: number | null) => void;
  onClick?: (i: number) => void;
  renderExtra?: (t: ChipToken, i: number) => ReactNode;
}

export function TokenChips({ tokens, size = 'md', showIds = true, onHover, onClick, renderExtra }: Props) {
  return (
    <div className="chips">
      {tokens.map((t, i) => {
        const cls = [
          'chip',
          t.muted ? 'chip--muted' : `chip--${(t.color ?? i) % 6}`,
          t.highlight && 'chip--hl',
          size === 'sm' && 'chip--sm',
        ]
          .filter(Boolean)
          .join(' ');
        const Tag = onClick ? 'button' : 'span';
        return (
          <Tag
            key={i}
            className={cls}
            title={t.title}
            onMouseEnter={onHover ? () => onHover(i) : undefined}
            onMouseLeave={onHover ? () => onHover(null) : undefined}
            onClick={onClick ? () => onClick(i) : undefined}
            style={onClick ? { cursor: 'pointer', border: undefined } : undefined}
            type={onClick ? 'button' : undefined}
          >
            <span>{t.text.replace(/ /g, '␣')}</span>
            {showIds && t.id !== undefined && <span className="chip__id">{t.id}</span>}
            {renderExtra?.(t, i)}
          </Tag>
        );
      })}
    </div>
  );
}

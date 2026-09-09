import type { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost';
  size?: 'md' | 'sm';
}

export function Button({ variant = 'default', size = 'md', className = '', type = 'button', ...rest }: Props) {
  const cls = ['btn', variant !== 'default' && `btn--${variant}`, size === 'sm' && 'btn--sm', className].filter(Boolean).join(' ');
  return <button type={type} className={cls} {...rest} />;
}

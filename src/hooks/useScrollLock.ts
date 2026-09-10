import { useEffect } from 'react';

/** Пока `locked`, страница под развёрнутой сценой не прокручивается. */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    document.body.classList.add('is-scroll-locked');
    return () => document.body.classList.remove('is-scroll-locked');
  }, [locked]);
}

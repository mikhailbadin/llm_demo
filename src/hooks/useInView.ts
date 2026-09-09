import { useEffect, useState, type RefObject } from 'react';

/** Становится true, когда элемент приближается к viewport; `sticky` — остаётся true навсегда после первого раза. */
export function useInView(ref: RefObject<Element | null>, options?: { rootMargin?: string; sticky?: boolean }): boolean {
  const [inView, setInView] = useState(false);
  const rootMargin = options?.rootMargin ?? '200px';
  const sticky = options?.sticky ?? false;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (sticky) obs.disconnect();
          } else if (!sticky) {
            setInView(false);
          }
        }
      },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, rootMargin, sticky]);
  return inView;
}

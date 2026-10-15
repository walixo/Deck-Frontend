import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Motion for Deck Games — eased, scroll-led, and always optional.
 *
 * Every effect here checks `prefers-reduced-motion` and, when it is set,
 * hands back the finished state: the curve fully drawn, the warp at rest, the
 * headline already in place. Nothing in the arcade depends on movement to be
 * read.
 */

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/** True once the element has been on screen. Stays true — entrances run once. */
export function useInView<T extends Element>(
  margin = '0px 0px -12% 0px',
): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  /* No observer (very old browsers): show everything at once. */
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: margin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [margin, seen]);

  return [ref, seen];
}

/**
 * How far the page has scrolled through an element, 0 → 1.
 *
 * 0 when its top reaches the top of the viewport, 1 when its bottom reaches
 * the bottom — exactly the range a sticky child stays pinned for, which is
 * what every scroll scene here is built on.
 * Written to a ref and a state on animation frames, never per scroll event.
 */
export function useScrollProgress<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const value = travel <= 0 ? (rect.top <= 0 ? 1 : 0) : -rect.top / travel;
      setProgress(Math.min(1, Math.max(0, value)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return [ref, progress];
}

/** Maps `value` from [start, end] onto [0, 1], clamped. */
export const span = (value: number, start: number, end: number): number =>
  Math.min(1, Math.max(0, (value - start) / (end - start)));

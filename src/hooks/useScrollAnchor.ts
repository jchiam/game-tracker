import { useEffect, useRef } from 'react';

/**
 * Scrolls the ref'd element into view on mount — the equipment editor's
 * anchor-slot behaviour. Optional call: jsdom has no scrollIntoView.
 */
export function useScrollAnchor<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    ref.current?.scrollIntoView?.({ block: 'start' });
  }, []);
  return ref;
}

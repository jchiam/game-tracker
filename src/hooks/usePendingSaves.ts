import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Shared debounced-save mechanism for game tracker hooks.
 *
 * queueUpdate  — merges partial updates for the same key, then flushes once.
 *                Use for simple field updates (level, flags, etc.).
 * queueAction  — debounces an arbitrary async action for a key (latest wins).
 *                Use for complex payloads like relic upserts.
 *
 * pendingSaveCount is >0 while any write is in flight, and the hook
 * installs a beforeunload guard to warn the user before leaving.
 */
export function usePendingSaves(delayMs = 1000, onFlushError?: (e: unknown) => void) {
  const [pendingSaveCount, setPendingSaveCount] = useState(0);
  const pendingPayloads = useRef<Record<string, Record<string, any>>>({});
  const timeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (pendingSaveCount > 0) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [pendingSaveCount]);

  const queueUpdate = useCallback(
    (
      key: string,
      updates: Record<string, any>,
      flushFn: (merged: Record<string, any>) => Promise<void>,
    ) => {
      pendingPayloads.current[key] = { ...pendingPayloads.current[key], ...updates };
      if (timeouts.current[key]) {
        clearTimeout(timeouts.current[key]);
      } else {
        setPendingSaveCount((n) => n + 1);
      }
      timeouts.current[key] = setTimeout(async () => {
        const payload = pendingPayloads.current[key];
        delete pendingPayloads.current[key];
        delete timeouts.current[key];
        try {
          await flushFn(payload);
        } catch (e) {
          console.error(e);
          onFlushError?.(e);
        } finally {
          setPendingSaveCount((n) => n - 1);
        }
      }, delayMs);
    },
    [delayMs],
  );

  const queueAction = useCallback(
    (key: string, action: () => Promise<void>) => {
      if (timeouts.current[key]) {
        clearTimeout(timeouts.current[key]);
      } else {
        setPendingSaveCount((n) => n + 1);
      }
      const captured = action;
      timeouts.current[key] = setTimeout(async () => {
        delete timeouts.current[key];
        try {
          await captured();
        } catch (e) {
          console.error(e);
          onFlushError?.(e);
        } finally {
          setPendingSaveCount((n) => n - 1);
        }
      }, delayMs);
    },
    [delayMs],
  );

  return { pendingSaveCount, queueUpdate, queueAction };
}

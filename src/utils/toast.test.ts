import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Toast } from '@/utils/toast';

describe('toast utility', () => {
  beforeEach(() => {
    // Reset the toast module state by re-importing
    // Since the module uses module-level state, we need to clear it
    vi.resetModules();
  });

  describe('addToast', () => {
    it('creates a toast with default type "info"', async () => {
      const { addToast: addToastFresh, subscribeToast: subscribeToastFresh } =
        await import('@/utils/toast');
      const toasts: Toast[][] = [];
      subscribeToastFresh((t) => toasts.push([...t]));

      const id = addToastFresh('Test message');

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(toasts).toHaveLength(2); // Initial subscription + update
      expect(toasts[1]).toHaveLength(1);
      expect(toasts[1][0]).toMatchObject({
        id,
        message: 'Test message',
        type: 'info',
      });
    });

    it('creates a toast with custom type', async () => {
      const { addToast: addToastFresh, subscribeToast: subscribeToastFresh } =
        await import('@/utils/toast');
      const toasts: Toast[][] = [];
      subscribeToastFresh((t) => toasts.push([...t]));

      const id = addToastFresh('Error occurred', 'error');

      expect(toasts[1][0]).toMatchObject({
        id,
        message: 'Error occurred',
        type: 'error',
      });
    });

    it('generates unique IDs', async () => {
      const { addToast: addToastFresh } = await import('@/utils/toast');
      const id1 = addToastFresh('First');
      const id2 = addToastFresh('Second');

      expect(id1).not.toBe(id2);
    });

    it('notifies subscribers when toast is added', async () => {
      const { addToast: addToastFresh, subscribeToast: subscribeToastFresh } =
        await import('@/utils/toast');
      const listener = vi.fn();
      subscribeToastFresh(listener);
      listener.mockClear(); // clear the initial call

      addToastFresh('New toast');

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls.at(-1)!;
      expect(lastCall[0]).toHaveLength(1);
      expect(lastCall[0][0].message).toBe('New toast');
    });

    it('auto-removes toast after duration', async () => {
      vi.useFakeTimers();
      const { addToast: addToastFresh, subscribeToast: subscribeToastFresh } =
        await import('@/utils/toast');
      const toasts: Toast[][] = [];
      subscribeToastFresh((t) => toasts.push([...t]));

      addToastFresh('Temporary', 'info', 100);

      // Initial state (index 0 = subscription call with [], index 1 = after add)
      expect(toasts.at(-1)).toHaveLength(1);

      // Advance past the duration
      await vi.advanceTimersByTimeAsync(150);

      // Toast should be removed
      expect(toasts.at(-1)).toHaveLength(0);
      vi.useRealTimers();
    });

    it('does not auto-remove when duration is 0', async () => {
      const { addToast: addToastFresh, subscribeToast: subscribeToastFresh } =
        await import('@/utils/toast');
      const toasts: Toast[][] = [];
      subscribeToastFresh((t) => toasts.push([...t]));

      addToastFresh('Persistent', 'info', 0);

      expect(toasts.at(-1)).toHaveLength(1);
    });
  });

  describe('removeToast', () => {
    it('removes a toast by ID', async () => {
      const {
        addToast: addToastFresh,
        removeToast: removeToastFresh,
        subscribeToast: subscribeToastFresh,
      } = await import('@/utils/toast');
      const toasts: Toast[][] = [];
      subscribeToastFresh((t) => toasts.push([...t]));

      const id = addToastFresh('To remove');
      removeToastFresh(id);

      expect(toasts.at(-1)).toHaveLength(0);
    });

    it('does nothing if ID does not exist', async () => {
      const { removeToast: removeToastFresh, subscribeToast: subscribeToastFresh } =
        await import('@/utils/toast');
      const toasts: Toast[][] = [];
      subscribeToastFresh((t) => toasts.push([...t]));

      removeToastFresh('non-existent-id');

      expect(toasts.at(-1)).toHaveLength(0);
    });

    it('notifies subscribers when toast is removed', async () => {
      const {
        addToast: addToastFresh,
        removeToast: removeToastFresh,
        subscribeToast: subscribeToastFresh,
      } = await import('@/utils/toast');
      const listener = vi.fn();
      subscribeToastFresh(listener);

      const id = addToastFresh('To remove');
      listener.mockClear();

      removeToastFresh(id);

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls.at(-1)!;
      expect(lastCall[0]).toHaveLength(0);
    });
  });

  describe('subscribeToast', () => {
    it('calls listener immediately with current toasts', async () => {
      const { subscribeToast: subscribeFresh, addToast: addToastFresh } =
        await import('@/utils/toast');
      addToastFresh('Existing toast');

      const listener = vi.fn();
      subscribeFresh(listener);

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls.at(-1)!;
      expect(lastCall[0]).toHaveLength(1);
      expect(lastCall[0][0].message).toBe('Existing toast');
    });

    it('returns an unsubscribe function', async () => {
      const { subscribeToast: subscribeFresh } = await import('@/utils/toast');
      const listener = vi.fn();
      const unsubscribe = subscribeFresh(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('stops calling listener after unsubscribe', async () => {
      const { subscribeToast: subscribeFresh, addToast: addToastFresh } =
        await import('@/utils/toast');
      const listener = vi.fn();
      const unsubscribe = subscribeFresh(listener);

      listener.mockClear();
      unsubscribe();

      addToastFresh('After unsubscribe');

      expect(listener).not.toHaveBeenCalled();
    });

    it('can have multiple subscribers', async () => {
      const { subscribeToast: subscribeFresh, addToast: addToastFresh } =
        await import('@/utils/toast');
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      subscribeFresh(listener1);
      subscribeFresh(listener2);

      addToastFresh('Multi-subscriber test');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });
});

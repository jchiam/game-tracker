import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePendingSaves } from '@/hooks/usePendingSaves';

describe('usePendingSaves', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('starts with zero pending saves', () => {
      const { result } = renderHook(() => usePendingSaves());

      expect(result.current.pendingSaveCount).toBe(0);
    });

    it('exposes queueUpdate and queueAction functions', () => {
      const { result } = renderHook(() => usePendingSaves());

      expect(typeof result.current.queueUpdate).toBe('function');
      expect(typeof result.current.queueAction).toBe('function');
    });
  });

  describe('queueUpdate', () => {
    it('increments pendingSaveCount when queued', () => {
      const { result } = renderHook(() => usePendingSaves());
      const flushFn = vi.fn().mockResolvedValue(undefined);

      act(() => {
        result.current.queueUpdate('key-1', { level: 10 }, flushFn);
      });

      expect(result.current.pendingSaveCount).toBe(1);
    });

    it('does not increment pendingSaveCount for duplicate keys', () => {
      const { result } = renderHook(() => usePendingSaves());
      const flushFn = vi.fn().mockResolvedValue(undefined);

      act(() => {
        result.current.queueUpdate('key-1', { level: 10 }, flushFn);
        result.current.queueUpdate('key-1', { name: 'test' }, flushFn);
      });

      expect(result.current.pendingSaveCount).toBe(1);
    });

    it('merges updates for the same key', async () => {
      const { result } = renderHook(() => usePendingSaves());
      const flushFn = vi.fn().mockResolvedValue(undefined);

      act(() => {
        result.current.queueUpdate('key-1', { level: 10 }, flushFn);
        result.current.queueUpdate('key-1', { name: 'test' }, flushFn);
      });

      // Fast-forward timers
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(flushFn).toHaveBeenCalledWith({ level: 10, name: 'test' });
    });

    it('flushes after the delay', async () => {
      const { result } = renderHook(() => usePendingSaves(500));
      const flushFn = vi.fn().mockResolvedValue(undefined);

      act(() => {
        result.current.queueUpdate('key-1', { level: 10 }, flushFn);
      });

      // Not yet flushed
      expect(flushFn).not.toHaveBeenCalled();
      expect(result.current.pendingSaveCount).toBe(1);

      // Advance past the delay
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(flushFn).toHaveBeenCalledWith({ level: 10 });
      expect(result.current.pendingSaveCount).toBe(0);
    });

    it('resets the timer when same key is queued again', async () => {
      const { result } = renderHook(() => usePendingSaves(500));
      const flushFn = vi.fn().mockResolvedValue(undefined);

      act(() => {
        result.current.queueUpdate('key-1', { level: 10 }, flushFn);
      });

      // Advance partway
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Queue again - resets timer
      act(() => {
        result.current.queueUpdate('key-1', { level: 20 }, flushFn);
      });

      // Should not have flushed yet (timer reset)
      expect(flushFn).not.toHaveBeenCalled();

      // Advance past the full delay from reset
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(flushFn).toHaveBeenCalledWith({ level: 20 });
    });

    it('handles multiple keys independently', async () => {
      const { result } = renderHook(() => usePendingSaves());
      const flushFn1 = vi.fn().mockResolvedValue(undefined);
      const flushFn2 = vi.fn().mockResolvedValue(undefined);

      act(() => {
        result.current.queueUpdate('key-1', { level: 10 }, flushFn1);
        result.current.queueUpdate('key-2', { name: 'test' }, flushFn2);
      });

      expect(result.current.pendingSaveCount).toBe(2);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(flushFn1).toHaveBeenCalledWith({ level: 10 });
      expect(flushFn2).toHaveBeenCalledWith({ name: 'test' });
      expect(result.current.pendingSaveCount).toBe(0);
    });
  });

  describe('queueAction', () => {
    it('increments pendingSaveCount when queued', () => {
      const { result } = renderHook(() => usePendingSaves());
      const action = vi.fn().mockResolvedValue(undefined);

      act(() => {
        result.current.queueAction('action-1', action);
      });

      expect(result.current.pendingSaveCount).toBe(1);
    });

    it('does not increment for duplicate keys', () => {
      const { result } = renderHook(() => usePendingSaves());
      const action1 = vi.fn().mockResolvedValue(undefined);
      const action2 = vi.fn().mockResolvedValue(undefined);

      act(() => {
        result.current.queueAction('action-1', action1);
        result.current.queueAction('action-1', action2);
      });

      expect(result.current.pendingSaveCount).toBe(1);
    });

    it('executes the action after the delay', async () => {
      const { result } = renderHook(() => usePendingSaves(500));
      const action = vi.fn().mockResolvedValue(undefined);

      act(() => {
        result.current.queueAction('action-1', action);
      });

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(action).toHaveBeenCalledTimes(1);
      expect(result.current.pendingSaveCount).toBe(0);
    });

    it('replaces the action when same key is re-queued', async () => {
      const { result } = renderHook(() => usePendingSaves());
      const action1 = vi.fn().mockResolvedValue(undefined);
      const action2 = vi.fn().mockResolvedValue(undefined);

      act(() => {
        result.current.queueAction('action-1', action1);
        result.current.queueAction('action-1', action2);
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(action1).not.toHaveBeenCalled();
      expect(action2).toHaveBeenCalledTimes(1);
    });
  });

  describe('onFlushError callback', () => {
    it('calls onFlushError when queueUpdate flush function throws', async () => {
      const onFlushError = vi.fn();
      const { result } = renderHook(() => usePendingSaves(500, onFlushError));
      const flushFn = vi.fn().mockRejectedValue(new Error('DB error'));

      act(() => {
        result.current.queueUpdate('key-1', { level: 10 }, flushFn);
      });

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(onFlushError).toHaveBeenCalledTimes(1);
      expect(result.current.pendingSaveCount).toBe(0);
    });

    it('calls onFlushError when queueAction action throws', async () => {
      const onFlushError = vi.fn();
      const { result } = renderHook(() => usePendingSaves(500, onFlushError));
      const action = vi.fn().mockRejectedValue(new Error('DB error'));

      act(() => {
        result.current.queueAction('action-1', action);
      });

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(onFlushError).toHaveBeenCalledTimes(1);
      expect(result.current.pendingSaveCount).toBe(0);
    });

    it('still decrements pendingSaveCount even when flush throws', async () => {
      const { result } = renderHook(() => usePendingSaves(500));
      const flushFn = vi.fn().mockRejectedValue(new Error('DB error'));

      act(() => {
        result.current.queueUpdate('key-1', { level: 10 }, flushFn);
      });

      expect(result.current.pendingSaveCount).toBe(1);

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.pendingSaveCount).toBe(0);
    });
  });

  describe('beforeunload guard', () => {
    it('adds beforeunload listener when there are pending saves', () => {
      const addEventListener = vi.spyOn(window, 'addEventListener');
      const { result } = renderHook(() => usePendingSaves());

      act(() => {
        result.current.queueUpdate('key-1', { level: 10 }, vi.fn().mockResolvedValue(undefined));
      });

      expect(addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
      addEventListener.mockRestore();
    });

    it('prevents default on beforeunload when saves are pending', () => {
      const { result } = renderHook(() => usePendingSaves());
      let beforeunloadHandler: ((e: BeforeUnloadEvent) => void) | null = null;

      vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
        if (event === 'beforeunload') {
          beforeunloadHandler = handler as (e: BeforeUnloadEvent) => void;
        }
      });

      act(() => {
        result.current.queueUpdate('key-1', { level: 10 }, vi.fn().mockResolvedValue(undefined));
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as BeforeUnloadEvent;
      (beforeunloadHandler as ((e: BeforeUnloadEvent) => void) | null)?.(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });
});

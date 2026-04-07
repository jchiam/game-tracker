/**
 * Lightweight toast notification system using event emitter pattern.
 * Works from both React components and plain functions/hooks.
 */

export interface Toast {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'success' | 'info';
}

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
let listeners: Listener[] = [];

function notify() {
  for (const listener of listeners) {
    listener(toasts);
  }
}

export function addToast(message: string, type: Toast['type'] = 'info', durationMs = 4000): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  toasts = [...toasts, { id, message, type }];
  notify();

  if (durationMs > 0) {
    setTimeout(() => removeToast(id), durationMs);
  }

  return id;
}

export function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export function subscribeToast(listener: Listener): () => void {
  listeners.push(listener);
  listener(toasts);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

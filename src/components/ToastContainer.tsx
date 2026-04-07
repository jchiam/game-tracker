import { useState, useEffect } from 'react';
import { subscribeToast, removeToast, type Toast } from '@/utils/toast';
import './ToastContainer.css';

const typeIcons: Record<Toast['type'], string> = {
  error: '✕',
  warning: '⚠',
  success: '✓',
  info: 'ℹ',
};

function ToastItem({ toast }: { toast: Toast }) {
  return (
    <div className={`toast toast-${toast.type}`} role="alert">
      <span className="toast-icon">{typeIcons[toast.type]}</span>
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-close"
        onClick={() => removeToast(toast.id)}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return subscribeToast(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

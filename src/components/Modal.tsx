import { useEffect } from 'react';
import '@/components/Modal.css';

interface ModalProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  onEscPress?: () => void;
  /**
   * When set, children are wrapped in a body div carrying this class. Canonical
   * value is "modal-body" (padding, column layout, scrolling — Modal.css),
   * optionally extended with a per-modal modifier: "modal-body foo-editor-body".
   * Omit only for deliberately full-bleed layouts (e.g. the entity picker's
   * search bar + result list).
   */
  bodyClassName?: string;
}

export function Modal({
  onClose,
  title,
  children,
  footer,
  className,
  onEscPress,
  bodyClassName,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscPress ? onEscPress() : onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onEscPress]);

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className={`modal-content${className ? ` ${className}` : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        {bodyClassName ? <div className={bodyClassName}>{children}</div> : children}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

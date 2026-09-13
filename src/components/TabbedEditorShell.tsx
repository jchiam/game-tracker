import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal } from '@/components/Modal';

export interface EditorTab {
  id: string;
  label: string;
  content: ReactNode;
  /** Rendered before the Done action while this tab is active. */
  footerExtra?: ReactNode;
  /** A disabled tab renders its button disabled and never becomes active. */
  disabled?: boolean;
}

interface TabbedEditorShellProps {
  title: string;
  /** Ordered tabs; at least one. Only the active tab's content renders. */
  tabs: EditorTab[];
  /** Tab to open on; defaults to the first tab. */
  initialTab?: string;
  className?: string;
  /** Per-editor modifier class; the shell prepends the canonical `modal-body` class. */
  bodyClassName: string;
  onClose: () => void;
}

/**
 * Structural shell of every tabbed editor modal — the N-tab scaffold under
 * `EquipmentEditorShell` (its two-tab adapter) and the Digimon progress editor.
 * Owns the modal chrome, the tab bar, the active-tab state (only the active
 * tab's content is rendered), the body wrapper, and the Done footer; callers
 * fill the tab bodies.
 */
export function TabbedEditorShell({
  title,
  tabs,
  initialTab,
  className,
  bodyClassName,
  onClose,
}: TabbedEditorShellProps) {
  const [activeId, setActiveId] = useState(() => {
    const requested = tabs.find((t) => t.id === initialTab && !t.disabled);
    return (requested ?? tabs.find((t) => !t.disabled) ?? tabs[0]).id;
  });
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  // Navigating onto a tab always lands at the top. Skipped on initial mount so an
  // anchor-slot scroll on modal open is preserved; on tab-return a child anchor
  // effect flushes before this one (parent), so top wins.
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const isFirstTab = useRef(true);
  useEffect(() => {
    if (isFirstTab.current) {
      isFirstTab.current = false;
      return;
    }
    bodyRef.current?.scrollTo?.({ top: 0 });
  }, [activeId]);

  return (
    <Modal
      title={title}
      onClose={onClose}
      className={className}
      footer={
        <>
          {active.footerExtra}
          <button className="btn primary-action" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      <div className="modal-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${tab.id === active.id ? 'active' : ''}`}
            disabled={tab.disabled}
            onClick={() => {
              if (!tab.disabled) setActiveId(tab.id);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* The tab bar must stay outside the scroll region, so the shell keeps its
          own body div (reusing the canonical .modal-body rule) instead of the
          Modal bodyClassName slot, which wraps all children. */}
      <div ref={bodyRef} className={`modal-body ${bodyClassName}`}>
        {active.content}
      </div>
    </Modal>
  );
}

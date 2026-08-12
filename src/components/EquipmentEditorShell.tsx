import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal } from '@/components/Modal';

interface EquipmentEditorShellProps {
  title: string;
  /** Equip tab label — the game's noun ("Equip Relics", "Equip Cards", "Equip Cartridge"). */
  equipTabLabel: string;
  className?: string;
  /** Per-game modifier class; the shell prepends the canonical `modal-body` class. */
  bodyClassName: string;
  equipContent: ReactNode;
  preferencesContent: ReactNode;
  /** Rendered before the Done action while the Equip tab is active (e.g. N2E's Un-equip button). */
  equipFooterExtra?: ReactNode;
  onClose: () => void;
}

/**
 * Structural shell of every equipment editor modal — sibling of GameCardShell
 * (Equipment Editor Shell in CONTEXT.md). Owns the modal chrome, the two-tab
 * scaffold, the active-tab state (only the active tab's content is rendered),
 * the body wrapper, and the Done footer; games fill the tab bodies.
 */
export function EquipmentEditorShell({
  title,
  equipTabLabel,
  className,
  bodyClassName,
  equipContent,
  preferencesContent,
  equipFooterExtra,
  onClose,
}: EquipmentEditorShellProps) {
  const [activeTab, setActiveTab] = useState<'equip' | 'preferences'>('equip');

  // Navigating onto a tab always lands at the top. Skipped on initial mount so an
  // anchor-slot scroll on modal open is preserved; on tab-return the equip tab's
  // anchor effect (child) flushes before this one (parent), so top wins.
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const isFirstTab = useRef(true);
  useEffect(() => {
    if (isFirstTab.current) {
      isFirstTab.current = false;
      return;
    }
    bodyRef.current?.scrollTo?.({ top: 0 });
  }, [activeTab]);

  return (
    <Modal
      title={title}
      onClose={onClose}
      className={className}
      footer={
        <>
          {activeTab === 'equip' && equipFooterExtra}
          <button className="btn primary-action" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      <div className="modal-tabs">
        <button
          className={`tab-btn ${activeTab === 'equip' ? 'active' : ''}`}
          onClick={() => setActiveTab('equip')}
        >
          {equipTabLabel}
        </button>
        <button
          className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Build Preferences
        </button>
      </div>

      {/* The tab bar must stay outside the scroll region, so the shell keeps its
          own body div (reusing the canonical .modal-body rule) instead of the
          Modal bodyClassName slot, which wraps all children. */}
      <div ref={bodyRef} className={`modal-body ${bodyClassName}`}>
        {activeTab === 'equip' ? equipContent : preferencesContent}
      </div>
    </Modal>
  );
}

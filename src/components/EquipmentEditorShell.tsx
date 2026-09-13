import { type ReactNode } from 'react';
import { TabbedEditorShell } from '@/components/TabbedEditorShell';

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
 * (Equipment Editor Shell in CONTEXT.md). A two-tab adapter over
 * `TabbedEditorShell`: the game's equip tab plus the constant "Build
 * Preferences" tab; games fill the tab bodies.
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
  return (
    <TabbedEditorShell
      title={title}
      className={className}
      bodyClassName={bodyClassName}
      onClose={onClose}
      tabs={[
        { id: 'equip', label: equipTabLabel, content: equipContent, footerExtra: equipFooterExtra },
        { id: 'preferences', label: 'Build Preferences', content: preferencesContent },
      ]}
    />
  );
}

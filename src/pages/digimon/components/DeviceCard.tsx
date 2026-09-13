import type { DgmDeviceCondition, DgmDeviceStatus, DgmTrackedDevice } from '@/types';
import { BuildComments } from '@/components/BuildComments';
import { FormGroup } from '@/components/FormGroup';
import { GameBadge } from '@/components/GameBadge';
import { GameCardShell } from '@/components/GameCardShell';
import { ProgressSection } from '@/components/ProgressSection';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { StatChip } from '@/components/StatChip';
import { getDeviceImageUrl } from '@/lib/imagekit';
import { lineModifier } from '@/pages/digimon/lineModifier';
import './DeviceCard.css';

const STATUS_OPTIONS = [
  { value: 'owned', label: 'Owned', modifier: 'dgm-status-owned' },
  { value: 'wishlist', label: 'Wishlist', modifier: 'dgm-status-wishlist' },
] as const;

const CONDITION_OPTIONS = [
  { value: 'sealed', label: 'Sealed', modifier: 'dgm-condition' },
  { value: 'boxed', label: 'Boxed', modifier: 'dgm-condition' },
  { value: 'loose', label: 'Loose', modifier: 'dgm-condition' },
] as const;

const STATUS_LABEL: Record<DgmDeviceStatus, string> = { owned: 'Owned', wishlist: 'Wishlist' };
const CONDITION_LABEL: Record<DgmDeviceCondition, string> = {
  sealed: 'Sealed',
  boxed: 'Boxed',
  loose: 'Loose',
};

interface DeviceCardProps {
  device: DgmTrackedDevice;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onUpdateStatus: (id: string, status: DgmDeviceStatus) => void;
  onUpdateCondition: (id: string, condition: DgmDeviceCondition | null) => void;
  onUpdateAcquiredOn: (id: string, date: string | null) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onToggleFavorite: (id: string, value: boolean) => void;
  /** Projection-stability release point — fired on the ✓ edit collapse. */
  onEditCommit?: () => void;
}

export function DeviceCard({
  device,
  onRemove,
  onUpdateStatus,
  onUpdateCondition,
  onUpdateAcquiredOn,
  onUpdateNotes,
  onToggleFavorite,
  onEditCommit,
}: DeviceCardProps) {
  return (
    <GameCardShell
      name={device.name}
      imageUrl={device.imageUrl}
      resolveImage={getDeviceImageUrl}
      entityNoun="Device"
      isFavorited={device.isFavorited}
      onToggleFavorite={(value) => onToggleFavorite(device.id, value)}
      onRemove={(e) => onRemove(device.id, e)}
      onEditCommit={onEditCommit}
      badges={
        <>
          <GameBadge label={device.line} variant="dgm-line" modifier={lineModifier(device.line)} />
          <GameBadge
            label={device.region}
            variant="dgm-region"
            modifier={device.region.toLowerCase()}
          />
        </>
      }
      summaryStats={
        <>
          <StatChip
            label={STATUS_LABEL[device.status]}
            className={`dgm-status-chip dgm-status-chip-${device.status}`}
          />
          {device.condition && <StatChip label={CONDITION_LABEL[device.condition]} />}
          <StatChip label={String(device.releaseYear)} />
        </>
      }
      summaryLine={
        <span className="dgm-summary-line">
          {device.series}
          <span className="dgm-summary-sep">&nbsp;·&nbsp;</span>
          {device.colorway}
        </span>
      }
      editBody={
        <>
          <ProgressSection label="Status">
            <SegmentedButtons
              name={`status-${device.id}`}
              options={STATUS_OPTIONS}
              value={device.status}
              coloring="static"
              onChange={(v) => {
                if (v) onUpdateStatus(device.id, v as DgmDeviceStatus);
              }}
            />
          </ProgressSection>

          <ProgressSection label="Condition">
            <SegmentedButtons
              name={`condition-${device.id}`}
              options={CONDITION_OPTIONS}
              value={device.condition}
              coloring="static"
              allowDeselect
              onChange={(v) =>
                onUpdateCondition(device.id, (v as DgmDeviceCondition | null) ?? null)
              }
            />
          </ProgressSection>

          {/* No shared date primitive exists; a native date input is the right
              control and inherits the canonical `.form-group input` surface. */}
          <FormGroup label="Acquired" htmlFor={`acquired-${device.id}`}>
            <input
              id={`acquired-${device.id}`}
              type="date"
              value={device.acquiredOn ?? ''}
              onChange={(e) => onUpdateAcquiredOn(device.id, e.target.value || null)}
            />
          </FormGroup>

          <BuildComments
            label="Notes"
            value={device.notes}
            placeholder="Where it came from, box contents, mods…"
            onChange={(v) => onUpdateNotes(device.id, v)}
          />
        </>
      }
    />
  );
}

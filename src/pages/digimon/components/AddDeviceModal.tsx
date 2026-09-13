import type { DgmDevice } from '@/data/digimon/devices';
import type { DgmTrackedDevice } from '@/types';
import { AddEntityModal } from '@/components/AddEntityModal';
import { getDeviceImageUrl } from '@/lib/imagekit';
import { lineModifier } from '@/pages/digimon/lineModifier';

interface AddDeviceModalProps {
  availableDevices: DgmDevice[];
  trackedDevices: DgmTrackedDevice[];
  onAddDevice: (device: DgmDevice) => void;
  onClose: () => void;
}

export function AddDeviceModal({
  availableDevices,
  trackedDevices,
  onAddDevice,
  onClose,
}: AddDeviceModalProps) {
  return (
    <AddEntityModal
      title="Add Device"
      entityNoun="devices"
      available={availableDevices}
      tracked={trackedDevices}
      searchKeys={['name', 'line', 'series', 'colorway']}
      resolveImage={getDeviceImageUrl}
      getBadges={(device) => [
        { label: device.line, variant: 'dgm-line', modifier: lineModifier(device.line) },
        { label: device.region, variant: 'dgm-region', modifier: device.region.toLowerCase() },
      ]}
      onAdd={onAddDevice}
      onClose={onClose}
    />
  );
}

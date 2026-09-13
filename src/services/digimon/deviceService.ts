import { createRosterPersistence } from '@/services/rosterPersistence';
import type { DgmDevicePatch, DgmTrackedDevice } from '@/types';
import { ALL_DEVICES, type DgmDevice } from '@/data/digimon/devices';

/** Maps each camelCase patch key to its DB column. Schema stays service-private. */
const DEVICE_COLUMNS: Record<keyof DgmDevicePatch, string> = {
  status: 'status',
  condition: 'condition',
  acquiredOn: 'acquired_on',
  notes: 'notes',
  isFavorited: 'is_favorited',
};

const svc = createRosterPersistence<DgmDevice, DgmTrackedDevice, DgmDevicePatch>({
  table: 'dgm_tracked_devices',
  entityIdColumn: 'device_id',
  catalog: ALL_DEVICES,
  columns: DEVICE_COLUMNS,
  insertDefaults: {
    status: 'owned',
    condition: null,
    acquired_on: null,
    notes: '',
  },
  select: 'id, device_id, status, condition, acquired_on, notes, is_favorited',
  fromRow: (row, base) => ({
    ...base,
    dbId: row.id,
    isFavorited: !!row.is_favorited,
    status: row.status === 'wishlist' ? 'wishlist' : 'owned',
    condition: row.condition ?? null,
    // DATE columns come back as 'YYYY-MM-DD' strings; keep them as-is.
    acquiredOn: row.acquired_on ?? null,
    notes: row.notes ?? '',
  }),
});

export const loadDevicesFromDB = svc.load;
export const insertDevice = svc.insert;
export const deleteDevice = svc.remove;
export const updateDevice = svc.update;

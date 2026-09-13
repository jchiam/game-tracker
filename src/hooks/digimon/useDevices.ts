import { useCallback } from 'react';
import { type Session } from '@supabase/supabase-js';
import { ALL_DEVICES, type DgmDevice } from '@/data/digimon/devices';
import type { DgmDevicePatch, DgmTrackedDevice } from '@/types';
import {
  loadDevicesFromDB,
  insertDevice,
  deleteDevice,
  updateDevice,
} from '@/services/digimon/deviceService';
import { useRoster } from '@/hooks/useRoster';

export type DgmSortKey = 'ALPHA' | 'YEAR';

function createTrackedDevice(device: DgmDevice): DgmTrackedDevice {
  return {
    ...device,
    isFavorited: false,
    status: 'owned',
    condition: null,
    acquiredOn: null,
    notes: '',
  };
}

/**
 * The Digimon collection hook — the roster of the collection modality. Every
 * updater is declared via `makeFieldUpdater`; nothing here reads current state
 * or writes through `queueAction`.
 */
export function useDevices(session: Session | null, isAuthLoading: boolean) {
  const {
    availableEntities: availableDevices,
    trackedEntities: trackedDevices,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addEntity: addDevice,
    removeEntity: removeDevice,
    makeFieldUpdater,
    filterRoster,
  } = useRoster<DgmDevice, DgmTrackedDevice, DgmDevicePatch>(session, isAuthLoading, {
    allEntities: ALL_DEVICES,
    loadFromDB: loadDevicesFromDB,
    insertEntity: insertDevice,
    deleteEntity: deleteDevice,
    updateEntity: updateDevice,
    createTracked: createTrackedDevice,
    nounSingular: 'device',
    nounPlural: 'devices',
    fuseKeys: ['name', 'line', 'series', 'colorway'],
  });

  const updateStatus = makeFieldUpdater('status');
  const updateCondition = makeFieldUpdater('condition');
  const updateAcquiredOn = makeFieldUpdater('acquiredOn');
  const updateNotes = makeFieldUpdater('notes');
  const toggleFavorite = makeFieldUpdater('isFavorited');

  const getFilteredRoster = useCallback(
    (searchTerm: string, sortBy: DgmSortKey, entities?: DgmTrackedDevice[]) =>
      filterRoster(
        searchTerm,
        sortBy === 'YEAR' ? (a, b) => a.releaseYear - b.releaseYear : undefined,
        entities,
      ),
    [filterRoster],
  );

  return {
    availableDevices,
    trackedDevices,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addDevice,
    removeDevice,
    updateStatus,
    updateCondition,
    updateAcquiredOn,
    updateNotes,
    toggleFavorite,
    getFilteredRoster,
  };
}

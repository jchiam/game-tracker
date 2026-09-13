import { useDevices } from '@/hooks/digimon/useDevices';
import { useRosterView } from '@/hooks/useRosterView';
import { DeviceCard } from './components/DeviceCard';
import { AddDeviceModal } from './components/AddDeviceModal';
import { CompletionView } from './components/CompletionView';
import { RosterPageLayout } from '@/components/RosterPageLayout';
import type { Session } from '@supabase/supabase-js';
import './DigimonPage.css';

interface DigimonPageProps {
  session: Session | null;
  isAuthLoading: boolean;
  onSignIn: () => void;
}

export function DigimonPage({ session, isAuthLoading, onSignIn }: DigimonPageProps) {
  const {
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
  } = useDevices(session, isAuthLoading);

  const {
    view,
    setView,
    filteredRoster,
    isAddModalOpen,
    closeAddModal,
    search,
    sort,
    add,
    projection,
  } = useRosterView({
    sortModes: [
      { key: 'ALPHA', label: 'AZ', described: 'alphabetically' },
      { key: 'YEAR', label: 'Yr', described: 'by release year' },
    ],
    searchPlaceholder: 'Search by name, line, series, or colour…',
    addTitle: 'Add Device',
    addDisabled: isLoadError,
    filterRoster: getFilteredRoster,
    trackedEntities: trackedDevices,
  });

  return (
    <RosterPageLayout
      title="Digimon Virtual Pets"
      subtitle="Track your digivice and virtual-pet collection."
      secondViewLabel="Completion"
      view={view}
      onViewChange={setView}
      session={session}
      isAuthLoading={isAuthLoading}
      isInitialLoad={isInitialLoad}
      isLoadError={isLoadError}
      onRetry={retryLoad}
      onSignIn={onSignIn}
      hasTracked={trackedDevices.length > 0}
      hasMatches={filteredRoster.length > 0}
      emptyMessage="No devices in your collection yet. Use the + button to begin!"
      noMatchMessage="No devices match your search."
      search={search}
      sort={sort}
      add={add}
      cards={filteredRoster.map((device) => (
        <DeviceCard
          key={device.id}
          device={device}
          onRemove={removeDevice}
          onUpdateStatus={updateStatus}
          onUpdateCondition={updateCondition}
          onUpdateAcquiredOn={updateAcquiredOn}
          onUpdateNotes={updateNotes}
          onToggleFavorite={(id, value) => {
            // Favorite is a completed intent — release in the same handler
            toggleFavorite(id, value);
            projection.refreshBasis(id);
          }}
          onEditCommit={() => projection.refreshBasis(device.id)}
        />
      ))}
      secondView={
        <CompletionView
          trackedDevices={trackedDevices}
          session={session}
          isAuthLoading={isAuthLoading}
          isInitialLoad={isInitialLoad}
          isLoadError={isLoadError}
          onRetry={retryLoad}
          onSignIn={onSignIn}
        />
      }
      pendingSaveCount={pendingSaveCount}
    >
      {isAddModalOpen && (
        <AddDeviceModal
          availableDevices={availableDevices}
          trackedDevices={trackedDevices}
          onAddDevice={addDevice}
          onClose={closeAddModal}
        />
      )}
    </RosterPageLayout>
  );
}

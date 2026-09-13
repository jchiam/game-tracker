import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { DigimonPage } from './DigimonPage';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { DgmTrackedDevice } from '@/types';
import { ALL_DEVICES } from '@/data/digimon/devices';

vi.mock('@/hooks/digimon/useDevices', () => ({
  useDevices: vi.fn(),
}));

vi.mock('@/lib/imagekit', () => ({
  getDeviceImageUrl: (path: string) => path,
  getMugshotUrl: (path: string) => path,
  getAvatarUrl: (path: string) => path,
}));

import { useDevices } from '@/hooks/digimon/useDevices';

function makeDevice(id: string, name: string): DgmTrackedDevice {
  return {
    id,
    name,
    line: 'Digital Monster',
    series: 'Ver.1',
    releaseYear: 1997,
    region: 'JP',
    colorway: 'Brown',
    imageUrl: `/assets/digimon/devices/${id}.webp`,
    dbId: `db-${id}`,
    isFavorited: false,
    status: 'owned',
    condition: null,
    acquiredOn: null,
    notes: '',
  };
}

const defaultHook = {
  availableDevices: ALL_DEVICES,
  trackedDevices: [] as DgmTrackedDevice[],
  isInitialLoad: false,
  isLoadError: false,
  retryLoad: vi.fn(),
  pendingSaveCount: 0,
  addDevice: vi.fn(),
  removeDevice: vi.fn(),
  updateStatus: vi.fn(),
  updateCondition: vi.fn(),
  updateAcquiredOn: vi.fn(),
  updateNotes: vi.fn(),
  toggleFavorite: vi.fn(),
  getFilteredRoster: vi.fn().mockReturnValue([]),
};

const session = createMockSession();

describe('DigimonPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDevices).mockReturnValue(defaultHook);
  });

  it('shows sign-in check while auth is loading', () => {
    renderWithProviders(<DigimonPage session={null} isAuthLoading={true} onSignIn={vi.fn()} />);
    expect(screen.getByText(/checking sign-in/i)).toBeInTheDocument();
  });

  it('shows AuthGate when there is no session', () => {
    renderWithProviders(<DigimonPage session={null} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('shows the roster loading state during initial load', () => {
    vi.mocked(useDevices).mockReturnValue({ ...defaultHook, isInitialLoad: true });
    renderWithProviders(<DigimonPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText(/loading your roster/i)).toBeInTheDocument();
  });

  it('shows the load error state with Retry wired to retryLoad', () => {
    const retryLoad = vi.fn();
    vi.mocked(useDevices).mockReturnValue({ ...defaultHook, isLoadError: true, retryLoad });
    renderWithProviders(<DigimonPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/couldn.t load your roster/i);
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(retryLoad).toHaveBeenCalledTimes(1);
    expect(screen.getByTitle('Add Device')).toBeDisabled();
  });

  it('shows the collection empty state', () => {
    renderWithProviders(<DigimonPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText(/no devices in your collection yet/i)).toBeInTheDocument();
  });

  it('renders device cards when devices are tracked', () => {
    const devices = [makeDevice('a', 'Alpha Device'), makeDevice('b', 'Beta Device')];
    vi.mocked(useDevices).mockReturnValue({
      ...defaultHook,
      trackedDevices: devices,
      getFilteredRoster: vi.fn().mockReturnValue(devices),
    });
    renderWithProviders(<DigimonPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText('Alpha Device')).toBeInTheDocument();
    expect(screen.getByText('Beta Device')).toBeInTheDocument();
  });

  it('shows the no-match message when the search filters everything out', () => {
    vi.mocked(useDevices).mockReturnValue({
      ...defaultHook,
      trackedDevices: [makeDevice('a', 'Alpha Device')],
      getFilteredRoster: vi.fn().mockReturnValue([]),
    });
    renderWithProviders(<DigimonPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText(/no devices match your search/i)).toBeInTheDocument();
  });

  it('opens AddDeviceModal from the add button', () => {
    renderWithProviders(<DigimonPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Add Device'));
    expect(screen.getByRole('heading', { name: /add device/i })).toBeInTheDocument();
  });

  it('switches to the Completion view', () => {
    renderWithProviders(<DigimonPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /completion/i }));
    expect(screen.getByRole('region', { name: /collection completion/i })).toBeInTheDocument();
    expect(screen.getByText('All devices')).toBeInTheDocument();
  });

  it('shows SavingToast when pendingSaveCount > 0', () => {
    vi.mocked(useDevices).mockReturnValue({ ...defaultHook, pendingSaveCount: 2 });
    renderWithProviders(<DigimonPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the page title', () => {
    renderWithProviders(<DigimonPage session={null} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /digimon virtual pets/i })).toBeInTheDocument();
  });
});

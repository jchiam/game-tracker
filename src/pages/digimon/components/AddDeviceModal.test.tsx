import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddDeviceModal } from './AddDeviceModal';
import type { DgmDevice } from '@/data/digimon/devices';
import type { DgmTrackedDevice } from '@/types';

vi.mock('@/lib/imagekit', () => ({
  getDeviceImageUrl: (path: string) => path,
  getAvatarUrl: (path: string) => path,
}));

// Config-wiring tests only — generic picker behaviour (search mechanics, empty
// state, image fallback) is covered by AddEntityModal.test.tsx.

const sampleDevices: DgmDevice[] = [
  {
    id: 'digital-monster-ver1-brown',
    name: 'Digital Monster Ver.1 (Brown)',
    line: 'Digital Monster',
    series: 'Ver.1',
    releaseYear: 1997,
    region: 'JP',
    colorway: 'Brown',
    imageUrl: '/dm1.webp',
  },
  {
    id: 'd-power-red',
    name: 'D-Power (Red)',
    line: 'D-Power',
    series: 'D-Power',
    releaseYear: 2001,
    region: 'NA',
    colorway: 'Red',
    imageUrl: '/dpower.webp',
  },
];

const defaultProps = {
  availableDevices: sampleDevices,
  trackedDevices: [] as DgmTrackedDevice[],
  onAddDevice: vi.fn(),
  onClose: vi.fn(),
};

describe('AddDeviceModal', () => {
  it('renders the title and devices', () => {
    render(<AddDeviceModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /add device/i })).toBeInTheDocument();
    expect(screen.getByText('Digital Monster Ver.1 (Brown)')).toBeInTheDocument();
  });

  it('renders line and region badges with dgm modifier classes', () => {
    render(<AddDeviceModal {...defaultProps} />);
    expect(screen.getByText('Digital Monster').className).toBe(
      'game-badge dgm-line-badge dgm-line-digital-monster',
    );
    expect(screen.getByText('NA').className).toBe('game-badge dgm-region-badge dgm-region-na');
  });

  it('excludes tracked devices by id', () => {
    const tracked = [
      {
        ...sampleDevices[0],
        dbId: 'db-1',
        isFavorited: false,
        status: 'owned',
        condition: null,
        acquiredOn: null,
        notes: '',
      },
    ] as DgmTrackedDevice[];
    render(<AddDeviceModal {...defaultProps} trackedDevices={tracked} />);
    expect(screen.queryByText('Digital Monster Ver.1 (Brown)')).not.toBeInTheDocument();
    expect(screen.getByText('D-Power (Red)')).toBeInTheDocument();
  });

  it('searches by line (secondary search key)', async () => {
    const user = userEvent.setup();
    render(<AddDeviceModal {...defaultProps} />);
    await user.type(screen.getByPlaceholderText('Search devices...'), 'D-Power');
    expect(screen.getByText('D-Power (Red)')).toBeInTheDocument();
    expect(screen.queryByText('Digital Monster Ver.1 (Brown)')).not.toBeInTheDocument();
  });

  it('calls onAddDevice with the picked device', async () => {
    const user = userEvent.setup();
    render(<AddDeviceModal {...defaultProps} />);
    await user.click(screen.getByText('D-Power (Red)'));
    expect(defaultProps.onAddDevice).toHaveBeenCalledWith(sampleDevices[1]);
  });
});

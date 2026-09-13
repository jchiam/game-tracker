import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeviceCard } from './DeviceCard';
import { lineModifier } from '@/pages/digimon/lineModifier';
import type { DgmTrackedDevice } from '@/types';

vi.mock('@/lib/imagekit', () => ({
  getDeviceImageUrl: (path: string) => path,
  getMugshotUrl: (path: string) => path,
}));

function makeDevice(overrides: Partial<DgmTrackedDevice> = {}): DgmTrackedDevice {
  return {
    id: 'digital-monster-ver1-brown',
    name: 'Digital Monster Ver.1 (Brown)',
    line: 'Digital Monster',
    series: 'Ver.1',
    releaseYear: 1997,
    region: 'JP',
    colorway: 'Brown',
    imageUrl: '/assets/digimon/devices/digital-monster-ver1-brown.webp',
    dbId: 'db-1',
    isFavorited: false,
    status: 'owned',
    condition: null,
    acquiredOn: null,
    notes: '',
    ...overrides,
  };
}

describe('lineModifier', () => {
  it('slugs a product line into a class modifier', () => {
    expect(lineModifier('Digital Monster')).toBe('digital-monster');
    expect(lineModifier('D-3')).toBe('d-3');
    expect(lineModifier('Digivice iC')).toBe('digivice-ic');
  });
});

describe('DeviceCard', () => {
  const defaultProps = {
    device: makeDevice(),
    onRemove: vi.fn(),
    onUpdateStatus: vi.fn(),
    onUpdateCondition: vi.fn(),
    onUpdateAcquiredOn: vi.fn(),
    onUpdateNotes: vi.fn(),
    onToggleFavorite: vi.fn(),
    onEditCommit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders name, line and region badges', () => {
    render(<DeviceCard {...defaultProps} />);
    expect(screen.getByText('Digital Monster Ver.1 (Brown)')).toBeInTheDocument();
    expect(screen.getByText('Digital Monster').className).toBe(
      'game-badge dgm-line-badge dgm-line-digital-monster',
    );
    expect(screen.getByText('JP').className).toBe('game-badge dgm-region-badge dgm-region-jp');
  });

  it('renders status and year chips, and the series · colorway line', () => {
    const { container } = render(<DeviceCard {...defaultProps} />);
    expect(container.querySelector('.dgm-status-chip-owned')).toHaveTextContent('Owned');
    expect(screen.getByText('1997')).toHaveClass('stat-chip');
    expect(container.querySelector('.dgm-summary-line')).toHaveTextContent('Ver.1 · Brown');
  });

  it('omits the condition chip when condition is null and shows it when set', () => {
    const { container, rerender } = render(<DeviceCard {...defaultProps} />);
    expect(container.querySelectorAll('.stat-chip').length).toBe(2);
    rerender(<DeviceCard {...defaultProps} device={makeDevice({ condition: 'boxed' })} />);
    expect(container.querySelectorAll('.stat-chip').length).toBe(3);
    expect(screen.getAllByText('Boxed')[0]).toHaveClass('stat-chip');
  });

  it('calls onUpdateStatus when Wishlist is clicked', () => {
    render(<DeviceCard {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.click(screen.getByRole('button', { name: 'Wishlist' }));
    expect(defaultProps.onUpdateStatus).toHaveBeenCalledWith(
      'digital-monster-ver1-brown',
      'wishlist',
    );
  });

  it('calls onUpdateCondition with the picked condition, and null on deselect', () => {
    const { rerender } = render(<DeviceCard {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.click(screen.getByRole('button', { name: 'Loose' }));
    expect(defaultProps.onUpdateCondition).toHaveBeenCalledWith(
      'digital-monster-ver1-brown',
      'loose',
    );
    rerender(<DeviceCard {...defaultProps} device={makeDevice({ condition: 'loose' })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Loose' }));
    expect(defaultProps.onUpdateCondition).toHaveBeenLastCalledWith(
      'digital-monster-ver1-brown',
      null,
    );
  });

  it('calls onUpdateAcquiredOn with the ISO date, and null when cleared', () => {
    const { rerender } = render(<DeviceCard {...defaultProps} />);
    const input = screen.getByLabelText('Acquired') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2024-05-01' } });
    expect(defaultProps.onUpdateAcquiredOn).toHaveBeenCalledWith(
      'digital-monster-ver1-brown',
      '2024-05-01',
    );
    rerender(<DeviceCard {...defaultProps} device={makeDevice({ acquiredOn: '2024-05-01' })} />);
    expect((screen.getByLabelText('Acquired') as HTMLInputElement).value).toBe('2024-05-01');
    fireEvent.change(screen.getByLabelText('Acquired'), { target: { value: '' } });
    expect(defaultProps.onUpdateAcquiredOn).toHaveBeenLastCalledWith(
      'digital-monster-ver1-brown',
      null,
    );
  });

  it('calls onUpdateNotes as the user types', () => {
    render(<DeviceCard {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/where it came from/i), {
      target: { value: 'Gift' },
    });
    expect(defaultProps.onUpdateNotes).toHaveBeenCalledWith('digital-monster-ver1-brown', 'Gift');
  });

  it('toggles favorite and removes through the shell controls', async () => {
    const user = userEvent.setup();
    render(<DeviceCard {...defaultProps} />);
    await user.click(screen.getByTitle('Favorite Device'));
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('digital-monster-ver1-brown', true);
    await user.click(screen.getByTitle('Remove Device'));
    expect(defaultProps.onRemove).toHaveBeenCalledWith(
      'digital-monster-ver1-brown',
      expect.any(Object),
    );
  });

  it('fires onEditCommit on the ✓ edit collapse', async () => {
    const user = userEvent.setup();
    render(<DeviceCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    await user.click(screen.getByTitle('Done editing'));
    expect(defaultProps.onEditCommit).toHaveBeenCalledTimes(1);
  });
});

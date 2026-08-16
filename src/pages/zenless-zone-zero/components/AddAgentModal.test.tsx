import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AddAgentModal } from './AddAgentModal';
import type { ZzzAgent } from '@/data/zenless-zone-zero/agents';
import type { ZzzTrackedAgent } from '@/types';

// Config-wiring tests only — picker behaviour (search, exclusion, keyboard
// handling) is covered by the shared AddEntityModal tests.

const sampleAgents: ZzzAgent[] = [
  {
    id: '1011',
    name: 'Anby',
    rarity: 3,
    specialty: 'Stun',
    element: 'Elec',
    imageUrl: '/assets/zenless-zone-zero/agents/1011.webp',
  },
  {
    id: '1091',
    name: 'Miyabi',
    rarity: 4,
    specialty: 'Anomaly',
    element: 'FireFrost',
    imageUrl: '/assets/zenless-zone-zero/agents/1091.webp',
  },
];

describe('AddAgentModal', () => {
  const defaultProps = {
    availableAgents: sampleAgents,
    trackedAgents: [] as ZzzTrackedAgent[],
    onAddAgent: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Add Agent title and lists agents', () => {
    render(<AddAgentModal {...defaultProps} />);
    expect(screen.getByText('Add Agent')).toBeInTheDocument();
    expect(screen.getByText('Anby')).toBeInTheDocument();
    expect(screen.getByText('Miyabi')).toBeInTheDocument();
  });

  it('renders rarity, specialty, and element badges with mapped labels', () => {
    render(<AddAgentModal {...defaultProps} />);
    expect(screen.getByText('S').className).toBe('game-badge zzz-rarity-badge zzz-rarity-s');
    expect(screen.getByText('Stun').className).toBe(
      'game-badge zzz-specialty-badge zzz-specialty-stun',
    );
    expect(screen.getByText('Electric').className).toBe(
      'game-badge zzz-element-badge zzz-element-elec',
    );
    // Exact source code `FireFrost` displays as `Frost`.
    expect(screen.getByText('Frost').className).toBe(
      'game-badge zzz-element-badge zzz-element-frost',
    );
  });

  it('excludes tracked agents by id', () => {
    const tracked: ZzzTrackedAgent[] = [
      {
        ...sampleAgents[0],
        dbId: 'db-1',
        isFavorited: false,
        level: 1,
        mindscape: 0,
        coreSkill: 0,
        discs: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
        buildPreferences: { mainStats: { 4: [], 5: [], 6: [] }, subStats: [] },
      },
    ];
    render(<AddAgentModal {...defaultProps} trackedAgents={tracked} />);
    expect(screen.queryByText('Anby')).not.toBeInTheDocument();
    expect(screen.getByText('Miyabi')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArknightsEndfieldPage } from './ArknightsEndfieldPage';
import { createMockSession } from '@/test/mocks/supabase';

vi.mock('@/hooks/arknights-endfield/useOperators', () => ({
  useOperators: () => ({
    availableOperators: [],
    trackedOperators: [],
    isInitialLoad: false,
    isLoadError: false,
    retryLoad: vi.fn(),
    pendingSaveCount: 0,
    addOperator: vi.fn(),
    removeOperator: vi.fn(),
    updateLevel: vi.fn(),
    updatePotential: vi.fn(),
    toggleFavorite: vi.fn(),
    getFilteredRoster: () => [],
  }),
}));

vi.mock('@/hooks/arknights-endfield/useParties', () => ({
  useParties: () => ({
    parties: [],
    isLoading: false,
    saveParty: vi.fn(),
    deleteParty: vi.fn(),
    refreshParties: vi.fn(),
  }),
}));

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: (path: string) => path,
  getAvatarUrl: (path: string) => path,
}));

describe('ArknightsEndfieldPage', () => {
  it('renders page title', () => {
    render(
      <ArknightsEndfieldPage
        session={createMockSession()}
        isAuthLoading={false}
        onSignIn={vi.fn()}
      />,
    );
    expect(screen.getByText('Arknights: Endfield')).toBeInTheDocument();
  });

  it('shows auth gate when no session', () => {
    render(<ArknightsEndfieldPage session={null} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it('shows empty state with no tracked operators', () => {
    render(
      <ArknightsEndfieldPage
        session={createMockSession()}
        isAuthLoading={false}
        onSignIn={vi.fn()}
      />,
    );
    expect(screen.getByText(/No operators tracked/)).toBeInTheDocument();
  });
});

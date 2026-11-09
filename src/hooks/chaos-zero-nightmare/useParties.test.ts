import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createMockSession } from '@/test/mocks/supabase';

vi.mock('@/services/chaos-zero-nightmare/partyService', () => ({
  loadParties: vi.fn(),
  saveParty: vi.fn(),
  deleteParty: vi.fn(),
  toggleFavoriteParty: vi.fn(),
}));

import { useParties } from '@/hooks/chaos-zero-nightmare/useParties';
import * as partyService from '@/services/chaos-zero-nightmare/partyService';

const mockLoadParties = vi.mocked(partyService.loadParties);
const mockSaveParty = vi.mocked(partyService.saveParty);
const mockDeleteParty = vi.mocked(partyService.deleteParty);
const mockToggleFavoriteParty = vi.mocked(partyService.toggleFavoriteParty);

const mockSession = createMockSession();

const party = (overrides: Record<string, unknown> = {}) => ({
  id: 'p1',
  profileId: 'user-1',
  name: 'Nightmare Team',
  notes: null,
  tier: null,
  isFavorited: false,
  members: [{ entityId: 'mei-lin', slotIndex: 0 }],
  createdAt: '2026-01-01',
  ...overrides,
});

describe('useParties (czn)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadParties.mockResolvedValue([]);
    mockSaveParty.mockResolvedValue({ partyId: 'new-party-id' });
    mockDeleteParty.mockResolvedValue(true);
    mockToggleFavoriteParty.mockResolvedValue(true);
  });

  it('starts with empty parties', async () => {
    const { result } = renderHook(() => useParties(mockSession));
    await waitFor(() => expect(result.current.isInitialLoad).toBe(false));
    expect(result.current.parties).toEqual([]);
  });

  it('loads parties from DB on session', async () => {
    mockLoadParties.mockResolvedValue([party()]);
    const { result } = renderHook(() => useParties(mockSession));
    await waitFor(() => expect(result.current.isInitialLoad).toBe(false));
    expect(result.current.parties).toHaveLength(1);
    expect(result.current.parties[0].name).toBe('Nightmare Team');
    expect(mockLoadParties).toHaveBeenCalledWith(mockSession.user.id);
  });

  it('saveParty creates and reloads', async () => {
    const { result } = renderHook(() => useParties(mockSession));
    await waitFor(() => expect(result.current.isInitialLoad).toBe(false));

    mockLoadParties.mockResolvedValue([party({ id: 'new-party-id', name: 'New', members: [] })]);

    await act(async () => {
      await result.current.saveParty({ name: 'New', members: [] });
    });

    expect(mockSaveParty).toHaveBeenCalled();
    expect(result.current.parties).toHaveLength(1);
  });

  it('deleteParty removes from list', async () => {
    mockLoadParties.mockResolvedValue([party()]);
    const { result } = renderHook(() => useParties(mockSession));
    await waitFor(() => expect(result.current.parties).toHaveLength(1));

    await act(async () => {
      await result.current.deleteParty('p1');
    });
    expect(result.current.parties).toHaveLength(0);
    expect(mockDeleteParty).toHaveBeenCalledWith('p1');
  });

  it('returns empty when no session', async () => {
    const { result } = renderHook(() => useParties(null));
    await waitFor(() => expect(result.current.isInitialLoad).toBe(false));
    expect(result.current.parties).toEqual([]);
  });

  describe('toggleFavoriteParty', () => {
    it('updates local state and persists', async () => {
      mockLoadParties.mockResolvedValue([party()]);
      const { result } = renderHook(() => useParties(mockSession));
      await waitFor(() => expect(result.current.parties).toHaveLength(1));

      await act(async () => {
        await result.current.toggleFavoriteParty('p1', true);
      });

      expect(result.current.parties[0].isFavorited).toBe(true);
      expect(mockToggleFavoriteParty).toHaveBeenCalledWith('p1', true);
    });

    it('reverts local state when the write fails', async () => {
      mockToggleFavoriteParty.mockResolvedValue(false);
      mockLoadParties.mockResolvedValue([party()]);
      const { result } = renderHook(() => useParties(mockSession));
      await waitFor(() => expect(result.current.parties).toHaveLength(1));

      await act(async () => {
        await result.current.toggleFavoriteParty('p1', true);
      });

      expect(result.current.parties[0].isFavorited).toBe(false);
    });
  });
});

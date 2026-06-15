import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { createMockSession } from '@/test/mocks/supabase';

vi.mock('@/services/neverness-to-everness/partyService', () => ({
  loadParties: vi.fn(),
  saveParty: vi.fn(),
  deleteParty: vi.fn(),
  toggleFavoriteParty: vi.fn(),
}));

import { useParties } from '@/hooks/neverness-to-everness/useParties';
import * as partyService from '@/services/neverness-to-everness/partyService';

const mockLoadParties = vi.mocked(partyService.loadParties);
const mockSaveParty = vi.mocked(partyService.saveParty);
const mockDeleteParty = vi.mocked(partyService.deleteParty);
const mockToggleFavoriteParty = vi.mocked(partyService.toggleFavoriteParty);

const mockSession = createMockSession();

const sampleParty = {
  id: 'party-1',
  profileId: 'test-user-123',
  name: 'My Team',
  notes: null as string | null,
  tier: null as string | null,
  isFavorited: false,
  members: [] as { characterId: string; slotIndex: number }[],
  createdAt: new Date().toISOString(),
};

describe('useParties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadParties.mockResolvedValue([]);
    mockSaveParty.mockResolvedValue('new-party-id');
    mockDeleteParty.mockResolvedValue(true);
    mockToggleFavoriteParty.mockResolvedValue(true);
  });

  async function setup(session: Session | null = mockSession) {
    const hook = renderHook(() => useParties(session));
    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false);
    });
    return hook;
  }

  it('starts with empty parties', async () => {
    const { result } = await setup();
    expect(result.current.parties).toEqual([]);
  });

  it('returns empty parties when no session', async () => {
    const { result } = await setup(null);
    expect(result.current.parties).toEqual([]);
  });

  it('saveParty calls service and reloads parties', async () => {
    mockLoadParties.mockResolvedValueOnce([]).mockResolvedValueOnce([{ ...sampleParty }]);

    const { result } = await setup();

    await act(async () => {
      await result.current.saveParty({ name: 'My Team', members: [] });
    });

    expect(mockSaveParty).toHaveBeenCalled();
    expect(result.current.parties).toHaveLength(1);
    expect(result.current.parties[0].name).toBe('My Team');
  });

  it('saveParty returns null when no session', async () => {
    const { result } = await setup(null);

    let partyId: string | null = null;
    await act(async () => {
      partyId = await result.current.saveParty({ name: 'Test', members: [] });
    });

    expect(partyId).toBeNull();
  });

  it('deleteParty removes party from state', async () => {
    mockLoadParties.mockResolvedValue([{ ...sampleParty }]);

    const { result } = renderHook(() => useParties(mockSession));

    await waitFor(() => {
      expect(result.current.parties).toHaveLength(1);
    });

    await act(async () => {
      await result.current.deleteParty('party-1');
    });

    expect(result.current.parties).toEqual([]);
  });

  it('deleteParty returns false when no session', async () => {
    const { result } = await setup(null);

    let success = true;
    await act(async () => {
      success = await result.current.deleteParty('party-1');
    });

    expect(success).toBe(false);
  });

  it('toggleFavoriteParty updates local state', async () => {
    mockLoadParties.mockResolvedValue([{ ...sampleParty }]);

    const { result } = renderHook(() => useParties(mockSession));

    await waitFor(() => {
      expect(result.current.parties).toHaveLength(1);
    });

    await act(async () => {
      await result.current.toggleFavoriteParty('party-1', true);
    });

    expect(result.current.parties[0].isFavorited).toBe(true);
    expect(mockToggleFavoriteParty).toHaveBeenCalledWith('party-1', true);
  });

  it('toggleFavoriteParty reverts local state when the write fails', async () => {
    mockLoadParties.mockResolvedValue([{ ...sampleParty }]);
    mockToggleFavoriteParty.mockResolvedValue(false);

    const { result } = renderHook(() => useParties(mockSession));

    await waitFor(() => {
      expect(result.current.parties).toHaveLength(1);
    });

    await act(async () => {
      await result.current.toggleFavoriteParty('party-1', true);
    });

    expect(result.current.parties[0].isFavorited).toBe(false);
  });

  it('deleteParty keeps state when service returns false', async () => {
    mockLoadParties.mockResolvedValue([{ ...sampleParty }]);
    mockDeleteParty.mockResolvedValue(false);

    const { result } = renderHook(() => useParties(mockSession));

    await waitFor(() => {
      expect(result.current.parties).toHaveLength(1);
    });

    await act(async () => {
      await result.current.deleteParty('party-1');
    });

    expect(result.current.parties).toHaveLength(1);
  });
});

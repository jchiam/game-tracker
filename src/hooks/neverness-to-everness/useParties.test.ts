import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createMockSession } from '@/test/mocks/supabase';

describe('useParties', () => {
  const mockSession = createMockSession();

  beforeEach(async () => {
    vi.resetModules();
    vi.doMock('@/services/neverness-to-everness/partyService', () => ({
      loadParties: vi.fn().mockResolvedValue([]),
      saveParty: vi.fn().mockResolvedValue('new-party-id'),
      deleteParty: vi.fn().mockResolvedValue(true),
      toggleFavoriteParty: vi.fn().mockResolvedValue(undefined),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function setup(session = mockSession) {
    const { useParties } = await import('@/hooks/neverness-to-everness/useParties');
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
    const service = await import('@/services/neverness-to-everness/partyService');
    vi.mocked(service.loadParties).mockResolvedValue([
      {
        id: 'new-party-id',
        profileId: 'user-1',
        name: 'My Team',
        notes: null,
        tier: null,
        isFavorited: false,
        members: [],
        createdAt: new Date().toISOString(),
      },
    ]);

    const { result } = await setup();

    await act(async () => {
      await result.current.saveParty({ name: 'My Team', members: [] });
    });

    expect(service.saveParty).toHaveBeenCalled();
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
    const service = await import('@/services/neverness-to-everness/partyService');
    vi.mocked(service.loadParties).mockResolvedValue([
      {
        id: 'party-1',
        profileId: 'user-1',
        name: 'My Team',
        notes: null,
        tier: null,
        isFavorited: false,
        members: [],
        createdAt: new Date().toISOString(),
      },
    ]);

    const { useParties } = await import('@/hooks/neverness-to-everness/useParties');
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
    const service = await import('@/services/neverness-to-everness/partyService');
    vi.mocked(service.loadParties).mockResolvedValue([
      {
        id: 'party-1',
        profileId: 'user-1',
        name: 'My Team',
        notes: null,
        tier: null,
        isFavorited: false,
        members: [],
        createdAt: new Date().toISOString(),
      },
    ]);

    const { useParties } = await import('@/hooks/neverness-to-everness/useParties');
    const { result } = renderHook(() => useParties(mockSession));

    await waitFor(() => {
      expect(result.current.parties).toHaveLength(1);
    });

    act(() => {
      result.current.toggleFavoriteParty('party-1', true);
    });

    expect(result.current.parties[0].isFavorited).toBe(true);
    expect(service.toggleFavoriteParty).toHaveBeenCalledWith('party-1', true);
  });

  it('deleteParty keeps state when service returns false', async () => {
    const service = await import('@/services/neverness-to-everness/partyService');
    vi.mocked(service.loadParties).mockResolvedValue([
      {
        id: 'party-1',
        profileId: 'user-1',
        name: 'My Team',
        notes: null,
        tier: null,
        isFavorited: false,
        members: [],
        createdAt: new Date().toISOString(),
      },
    ]);
    vi.mocked(service.deleteParty).mockResolvedValue(false);

    const { useParties } = await import('@/hooks/neverness-to-everness/useParties');
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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createMockSession } from '@/test/mocks/supabase';

vi.mock('@/services/arknights-endfield/partyService', () => ({
  loadParties: vi.fn(),
  saveParty: vi.fn(),
  deleteParty: vi.fn(),
}));

import { useParties } from '@/hooks/arknights-endfield/useParties';
import * as partyService from '@/services/arknights-endfield/partyService';

const mockLoadParties = vi.mocked(partyService.loadParties);
const mockSaveParty = vi.mocked(partyService.saveParty);
const mockDeleteParty = vi.mocked(partyService.deleteParty);

const mockSession = createMockSession();

describe('useParties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadParties.mockResolvedValue([]);
    mockSaveParty.mockResolvedValue('new-party-id');
    mockDeleteParty.mockResolvedValue(true);
  });

  it('starts with empty parties', async () => {
    const { result } = renderHook(() => useParties(mockSession));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.parties).toEqual([]);
  });

  it('loads parties from DB on session', async () => {
    mockLoadParties.mockResolvedValue([
      {
        id: 'p1',
        profileId: 'user-1',
        name: 'Squad A',
        notes: null,
        members: [{ operatorId: 'ember', slotIndex: 0 }],
        createdAt: '2026-01-01',
      },
    ]);
    const { result } = renderHook(() => useParties(mockSession));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.parties).toHaveLength(1);
    expect(result.current.parties[0].name).toBe('Squad A');
  });

  it('saveParty creates and reloads', async () => {
    const { result } = renderHook(() => useParties(mockSession));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockLoadParties.mockResolvedValue([
      {
        id: 'new-party-id',
        profileId: 'user-1',
        name: 'New',
        notes: null,
        members: [],
        createdAt: '2026-01-01',
      },
    ]);

    await act(async () => {
      await result.current.saveParty({ name: 'New', members: [] });
    });

    expect(mockSaveParty).toHaveBeenCalled();
    expect(result.current.parties).toHaveLength(1);
  });

  it('deleteParty removes from list', async () => {
    mockLoadParties.mockResolvedValue([
      {
        id: 'p1',
        profileId: 'user-1',
        name: 'Squad',
        notes: null,
        members: [],
        createdAt: '2026-01-01',
      },
    ]);
    const { result } = renderHook(() => useParties(mockSession));
    await waitFor(() => expect(result.current.parties).toHaveLength(1));

    await act(async () => {
      await result.current.deleteParty('p1');
    });
    expect(result.current.parties).toHaveLength(0);
  });

  it('returns empty when no session', async () => {
    const { result } = renderHook(() => useParties(null));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.parties).toEqual([]);
  });
});

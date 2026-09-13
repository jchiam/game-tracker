import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBuilder } from '@/test/mocks/supabase';

// Config-wiring tests only — generic CRUD behaviour (DB-disabled early returns,
// error rethrow, catalog merge) is covered by rosterPersistence.test.ts.
describe('deviceService', () => {
  let mockFrom: ReturnType<typeof vi.fn>;
  let service: typeof import('@/services/digimon/deviceService');

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

    mockFrom = vi.fn().mockReturnValue(createBuilder());

    vi.doMock('@/lib/supabase', () => ({
      supabase: { from: mockFrom },
    }));

    service = await import('@/services/digimon/deviceService');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('loadDevicesFromDB transforms DB rows into DgmTrackedDevice objects', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      device_id: 'dm-color-ver1-original-brown',
      status: 'wishlist',
      condition: 'boxed',
      acquired_on: '2024-05-01',
      notes: 'Gift',
      is_favorited: true,
    };

    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

    const result = await service.loadDevicesFromDB('user-1');

    expect(mockFrom).toHaveBeenCalledWith('dgm_tracked_devices');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('dm-color-ver1-original-brown');
    expect(result[0].dbId).toBe('db-uuid-1');
    expect(result[0].status).toBe('wishlist');
    expect(result[0].condition).toBe('boxed');
    expect(result[0].acquiredOn).toBe('2024-05-01');
    expect(result[0].notes).toBe('Gift');
    expect(result[0].isFavorited).toBe(true);
    expect(result[0].name).toBe('Digital Monster COLOR Ver.1 (Original Brown)');
    expect(result[0].line).toBe('Digital Monster');
  });

  it('loadDevicesFromDB defaults nullable columns', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      device_id: 'dm-color-ver1-original-brown',
      status: 'owned',
      condition: null,
      acquired_on: null,
      notes: null,
      is_favorited: false,
    };
    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));
    const result = await service.loadDevicesFromDB('user-1');
    expect(result[0].status).toBe('owned');
    expect(result[0].condition).toBeNull();
    expect(result[0].acquiredOn).toBeNull();
    expect(result[0].notes).toBe('');
  });

  it('insertDevice inserts the entity FK column and configured defaults', async () => {
    const builder = createBuilder({ data: { id: 'new-db-id' }, error: null });
    mockFrom.mockReturnValue(builder);

    const result = await service.insertDevice('user-1', 'dm-color-ver1-original-brown');

    expect(builder.insert).toHaveBeenCalledWith({
      profile_id: 'user-1',
      device_id: 'dm-color-ver1-original-brown',
      status: 'owned',
      condition: null,
      acquired_on: null,
      notes: '',
    });
    expect(result).toBe('new-db-id');
  });

  it('updateDevice maps camelCase patch to snake_case columns', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    await service.updateDevice('db-uuid-1', {
      status: 'wishlist',
      condition: 'loose',
      acquiredOn: '2024-05-01',
      notes: 'Ebay',
      isFavorited: true,
    });

    expect(mockFrom).toHaveBeenCalledWith('dgm_tracked_devices');
    expect(builder.update).toHaveBeenCalledWith({
      status: 'wishlist',
      condition: 'loose',
      acquired_on: '2024-05-01',
      notes: 'Ebay',
      is_favorited: true,
    });
    expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
  });
});

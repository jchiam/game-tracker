import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBuilder } from '@/test/mocks/supabase';

// Config-wiring tests only — generic CRUD behaviour (DB-disabled early returns,
// error rethrow, catalog merge) is covered by rosterPersistence.test.ts.
describe('productService', () => {
  let mockFrom: ReturnType<typeof vi.fn>;
  let service: typeof import('@/services/digimon/productService');

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

    mockFrom = vi.fn().mockReturnValue(createBuilder());

    vi.doMock('@/lib/supabase', () => ({
      supabase: { from: mockFrom },
    }));

    service = await import('@/services/digimon/productService');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('loadProductsFromDB merges rows, joins variant state, and keeps the catalog product', async () => {
    const dbRow = {
      id: 'db-uuid-1',
      product_id: 'dv-25th-color-evolution',
      is_favorited: true,
      notes: 'Birthday',
      progress: ['partners:taichi-greymon'],
      dgm_tracked_variants: [
        { variant_id: 'dv-25th-anime-original', wishlist: false, sealed: 1, boxed: 0, loose: 1 },
        { variant_id: 'dv-25th-yagami-taichi', wishlist: true, sealed: 0, boxed: 0, loose: 0 },
      ],
    };
    mockFrom.mockReturnValue(createBuilder({ data: [dbRow], error: null }));

    const result = await service.loadProductsFromDB('user-1');

    expect(mockFrom).toHaveBeenCalledWith('dgm_tracked_products');
    expect(result).toHaveLength(1);
    const p = result[0];
    expect(p.id).toBe('dv-25th-color-evolution');
    expect(p.dbId).toBe('db-uuid-1');
    expect(p.name).toBe('Digivice -25th COLOR EVOLUTION-');
    expect(p.variants).toHaveLength(3);
    expect(p.guide?.tracks.map((t) => t.id)).toEqual(['partners', 'map']);
    expect(p.isFavorited).toBe(true);
    expect(p.notes).toBe('Birthday');
    expect(p.progress).toEqual(['partners:taichi-greymon']);
    expect(p.variantState).toEqual({
      'dv-25th-anime-original': { wishlist: false, copies: { sealed: 1, boxed: 0, loose: 1 } },
      'dv-25th-yagami-taichi': { wishlist: true, copies: { sealed: 0, boxed: 0, loose: 0 } },
    });
  });

  it('loadProductsFromDB defaults nullable columns and drops unknown products', async () => {
    mockFrom.mockReturnValue(
      createBuilder({
        data: [
          { id: 'db-1', product_id: 'not-a-product', progress: [] },
          {
            id: 'db-2',
            product_id: 'dm-ver-20th',
            is_favorited: false,
            notes: null,
            progress: null,
            dgm_tracked_variants: [
              {
                variant_id: 'dm-ver20th-original-brown',
                wishlist: null,
                sealed: null,
                boxed: '2',
                loose: -1,
              },
            ],
          },
        ],
        error: null,
      }),
    );
    const result = await service.loadProductsFromDB('user-1');
    expect(result).toHaveLength(1);
    expect(result[0].dbId).toBe('db-2');
    expect(result[0].notes).toBe('');
    expect(result[0].progress).toEqual([]);
    expect(result[0].variantState).toEqual({
      'dm-ver20th-original-brown': { wishlist: false, copies: { sealed: 0, boxed: 0, loose: 0 } },
    });
  });

  it('insertProduct inserts the entity FK column and configured defaults', async () => {
    const builder = createBuilder({ data: { id: 'new-db-id' }, error: null });
    mockFrom.mockReturnValue(builder);

    const result = await service.insertProduct('user-1', 'dm-ver-20th');

    expect(builder.insert).toHaveBeenCalledWith({
      profile_id: 'user-1',
      product_id: 'dm-ver-20th',
      is_favorited: false,
      notes: '',
      progress: [],
    });
    expect(result).toBe('new-db-id');
  });

  it('updateProduct maps camelCase patch to snake_case columns', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    await service.updateProduct('db-uuid-1', {
      notes: 'Ebay',
      isFavorited: true,
      progress: ['map:subspace'],
    });

    expect(mockFrom).toHaveBeenCalledWith('dgm_tracked_products');
    expect(builder.update).toHaveBeenCalledWith({
      notes: 'Ebay',
      is_favorited: true,
      progress: ['map:subspace'],
    });
    expect(builder.eq).toHaveBeenCalledWith('id', 'db-uuid-1');
  });

  it('upsertVariant writes one row resolved on the product + variant key', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    await service.upsertVariant('db-uuid-1', 'dv-25th-anime-original', {
      wishlist: true,
      copies: { sealed: 2, boxed: 0, loose: 0 },
    });

    expect(mockFrom).toHaveBeenCalledWith('dgm_tracked_variants');
    expect(builder.upsert).toHaveBeenCalledWith(
      {
        tracked_product_id: 'db-uuid-1',
        variant_id: 'dv-25th-anime-original',
        wishlist: true,
        sealed: 2,
        boxed: 0,
        loose: 0,
      },
      { onConflict: 'tracked_product_id,variant_id' },
    );
  });

  it('upsertVariant rethrows a DB error', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFrom.mockReturnValue(createBuilder({ data: null, error: { message: 'boom' } }));
    await expect(
      service.upsertVariant('db-uuid-1', 'x', {
        wishlist: false,
        copies: { sealed: 1, boxed: 0, loose: 0 },
      }),
    ).rejects.toEqual({ message: 'boom' });
    spy.mockRestore();
  });

  it('variant writes are no-ops when the DB is not configured', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', '');
    const offline = await import('@/services/digimon/productService');
    await offline.upsertVariant('db-uuid-1', 'x', {
      wishlist: false,
      copies: { sealed: 1, boxed: 0, loose: 0 },
    });
    await offline.deleteVariant('db-uuid-1', 'x');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('deleteVariant rethrows a DB error', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFrom.mockReturnValue(createBuilder({ data: null, error: { message: 'boom' } }));
    await expect(service.deleteVariant('db-uuid-1', 'x')).rejects.toEqual({ message: 'boom' });
    spy.mockRestore();
  });

  it('deleteVariant deletes by the product + variant key', async () => {
    const builder = createBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(builder);

    await service.deleteVariant('db-uuid-1', 'dv-25th-anime-original');

    expect(mockFrom).toHaveBeenCalledWith('dgm_tracked_variants');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.match).toHaveBeenCalledWith({
      tracked_product_id: 'db-uuid-1',
      variant_id: 'dv-25th-anime-original',
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import { lineModifier } from '@/pages/digimon/lineModifier';
import type { DgmCopyCounts, DgmTrackedProduct, DgmTrackedVariant } from '@/types';

const state = (copies: Partial<DgmCopyCounts>, wishlist = false): DgmTrackedVariant => ({
  wishlist,
  copies: { sealed: 0, boxed: 0, loose: 0, ...copies },
});

vi.mock('@/lib/imagekit', () => ({
  getDeviceImageUrl: (path: string) => path,
  getMugshotUrl: (path: string) => path,
}));

const plain = (track: string, n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `${track}:${i}`, label: `${track} ${i}` }));
const ids = (track: string, n: number) => Array.from({ length: n }, (_, i) => `${track}:${i}`);

function makeProduct(overrides: Partial<DgmTrackedProduct> = {}): DgmTrackedProduct {
  return {
    id: 'dv-25th-color-evolution',
    name: 'Digivice -25th COLOR EVOLUTION-',
    line: 'Digivice',
    series: '-25th COLOR EVOLUTION-',
    releaseYear: 2024,
    variants: [
      {
        id: 'anime',
        colorway: 'Anime Original',
        releaseYear: 2024,
        region: 'JP',
        imageUrl: '/a.webp',
      },
      { id: 'taichi', colorway: 'Taichi', releaseYear: 2024, region: 'JP', imageUrl: '/b.webp' },
      { id: 'yamato', colorway: 'Yamato', releaseYear: 2024, region: 'JP', imageUrl: '/c.webp' },
    ],
    guide: {
      overall: 'track-mean',
      tracks: [
        {
          id: 'partners',
          label: 'Partners',
          groups: [{ id: 'g', label: 'G', items: plain('partners', 22) }],
        },
        {
          id: 'friends',
          label: 'Friends',
          groups: [{ id: 'g', label: 'G', items: plain('friends', 82) }],
        },
        { id: 'map', label: 'Map', groups: [{ id: 'g', label: 'G', items: plain('map', 69) }] },
      ],
    },
    dbId: 'db-1',
    isFavorited: false,
    notes: '',
    progress: [],
    variantState: {},
    ...overrides,
  };
}

describe('lineModifier', () => {
  it('slugs a product line into a class modifier', () => {
    expect(lineModifier('Digital Monster')).toBe('digital-monster');
    expect(lineModifier('D-3')).toBe('d-3');
  });
});

describe('ProductCard', () => {
  const props = {
    onRemove: vi.fn(),
    onToggleFavorite: vi.fn(),
    onUpdateNotes: vi.fn(),
    onSetVariantCopies: vi.fn(),
    onSetVariantWishlist: vi.fn(),
    onToggleItem: vi.fn(),
    onEditCommit: vi.fn(),
  };

  it('renders an owned product with a guide: badge, chips, dots, and bars', () => {
    const product = makeProduct({
      variantState: {
        taichi: state({ sealed: 1, boxed: 1 }),
        yamato: state({}, true),
      },
      progress: [...ids('partners', 18), ...ids('friends', 21), ...ids('map', 35)],
    });
    const { container } = render(<ProductCard product={product} {...props} />);
    // mean(82, 26, 51) = 53
    expect(screen.getByText('53%')).toBeInTheDocument();
    expect(screen.getByText('Owned')).toHaveClass('dgm-status-chip-owned');
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByText('2 copies')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    const dots = container.querySelectorAll('.variant-dot');
    expect([...dots].map((d) => d.className)).toEqual([
      'variant-dot variant-dot-none',
      'variant-dot variant-dot-owned',
      'variant-dot variant-dot-wishlist',
    ]);
    const fills = container.querySelectorAll<HTMLElement>('.completion-bar-fill');
    expect([...fills].map((f) => f.style.width)).toEqual(['82%', '26%', '51%']);
    expect(container.querySelectorAll('.game-card-static-line')).toHaveLength(4);
    // Image is the first owned variant.
    expect(screen.getByAltText(product.name)).toHaveAttribute('src', '/b.webp');
  });

  it('renders an interested product: neutral chip, no badge, no bars, Manage still available', () => {
    const { container } = render(<ProductCard product={makeProduct()} {...props} />);
    expect(screen.getByText('Interested')).toHaveClass('dgm-status-chip-interested');
    expect(screen.getByText('0 / 3')).toBeInTheDocument();
    expect(screen.queryByText(/cop(y|ies)$/)).not.toBeInTheDocument();
    expect(container.querySelector('.product-progress-badge')).not.toBeInTheDocument();
    expect(container.querySelector('.completion-bar')).not.toBeInTheDocument();
    expect(screen.getByAltText(/Digivice/)).toHaveAttribute('src', '/a.webp');
    fireEvent.click(screen.getByTitle('Edit'));
    expect(screen.queryByRole('button', { name: 'Partners' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manage' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Manage' }));
    expect(screen.getByRole('button', { name: 'Partners' })).toBeDisabled();
  });

  it('renders a wishlist product without progress even when progress is stored', () => {
    const { container } = render(
      <ProductCard
        product={makeProduct({
          variantState: { anime: state({}, true) },
          progress: ids('map', 10),
        })}
        {...props}
      />,
    );
    expect(screen.getByText('Wishlist')).toHaveClass('dgm-status-chip-wishlist');
    expect(container.querySelector('.completion-bar')).not.toBeInTheDocument();
  });

  it('renders a sealed-only product as owned with a copy chip but no progress', () => {
    const { container } = render(
      <ProductCard
        product={makeProduct({
          variantState: { anime: state({ sealed: 1 }, true) },
          progress: ids('map', 10),
        })}
        {...props}
      />,
    );
    expect(screen.getByText('Owned')).toHaveClass('dgm-status-chip-owned');
    expect(screen.getByText('1 copy')).toBeInTheDocument();
    expect(container.querySelector('.product-progress-badge')).not.toBeInTheDocument();
    expect(container.querySelector('.completion-bar')).not.toBeInTheDocument();
    // Owned-and-wishlisted still reads as owned on the card.
    expect(container.querySelector('.variant-dot-wishlist')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.variant-dot-owned')).toHaveLength(1);
  });

  it('shows the line badge with its modifier and titles controls with the noun', () => {
    render(<ProductCard product={makeProduct()} {...props} />);
    expect(screen.getByText('Digivice').className).toBe(
      'game-badge dgm-line-badge dgm-line-digivice',
    );
    expect(screen.getByTitle('Favorite Product')).toBeInTheDocument();
    expect(screen.getByTitle('Remove Product')).toBeInTheDocument();
  });

  it('forwards favorite, remove, and notes', () => {
    render(<ProductCard product={makeProduct()} {...props} />);
    fireEvent.click(screen.getByTitle('Favorite Product'));
    expect(props.onToggleFavorite).toHaveBeenCalledWith('dv-25th-color-evolution', true);
    fireEvent.click(screen.getByTitle('Remove Product'));
    expect(props.onRemove).toHaveBeenCalledWith('dv-25th-color-evolution', expect.any(Object));
    fireEvent.change(screen.getByPlaceholderText(/where it came from/i), {
      target: { value: 'Gift' },
    });
    expect(props.onUpdateNotes).toHaveBeenCalledWith('dv-25th-color-evolution', 'Gift');
  });

  it('opens the editor on Variants, forwards a variant tick, and releases on close', () => {
    const onEditCommit = vi.fn();
    render(<ProductCard product={makeProduct()} {...props} onEditCommit={onEditCommit} />);
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.click(screen.getByRole('button', { name: 'Manage' }));
    expect(screen.getByRole('button', { name: 'Variants' })).toHaveClass('active');
    const row = screen.getByRole('listitem', { name: 'Taichi' });
    fireEvent.click(within(row).getByRole('button', { name: 'Increase Sealed' }));
    expect(props.onSetVariantCopies).toHaveBeenCalledWith(
      'dv-25th-color-evolution',
      'taichi',
      'sealed',
      1,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onEditCommit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Variants' })).not.toBeInTheDocument();
  });

  it('forwards a wishlist toggle from the editor with the product id', () => {
    render(
      <ProductCard
        product={makeProduct({ variantState: { taichi: state({ loose: 1 }) } })}
        {...props}
      />,
    );
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.click(screen.getByRole('button', { name: 'Manage' }));
    const row = screen.getByRole('listitem', { name: 'Taichi' });
    fireEvent.click(within(row).getByRole('button', { name: 'Wishlist' }));
    expect(props.onSetVariantWishlist).toHaveBeenCalledWith(
      'dv-25th-color-evolution',
      'taichi',
      true,
    );
  });

  it('reaches a track through the editor tabs for an owned product and forwards toggles', () => {
    const { container } = render(
      <ProductCard
        product={makeProduct({ variantState: { anime: state({ loose: 1 }) } })}
        {...props}
      />,
    );
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.click(screen.getByRole('button', { name: 'Manage' }));
    fireEvent.click(screen.getByRole('button', { name: 'Friends' }));
    expect(container.querySelector('.tab-btn.active')).toHaveTextContent('Friends');
    fireEvent.click(screen.getByLabelText('friends 30'));
    expect(props.onToggleItem).toHaveBeenCalledWith('dv-25th-color-evolution', 'friends:30');
  });
});

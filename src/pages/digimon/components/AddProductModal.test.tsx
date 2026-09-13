import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddProductModal } from './AddProductModal';
import type { DgmProduct } from '@/data/digimon/products';
import type { DgmTrackedProduct } from '@/types';

vi.mock('@/lib/imagekit', () => ({
  getDeviceImageUrl: (path: string) => path,
  getAvatarUrl: (path: string) => path,
}));

// Config-wiring tests only — generic picker behaviour (search mechanics, empty
// state, image fallback) is covered by AddEntityModal.test.tsx.

const products: DgmProduct[] = [
  {
    id: 'dv-25th-color-evolution',
    name: 'Digivice -25th COLOR EVOLUTION-',
    line: 'Digivice',
    series: '-25th COLOR EVOLUTION-',
    releaseYear: 2024,
    variants: [
      { id: 'a', colorway: 'Anime Original', releaseYear: 2024, region: 'JP', imageUrl: '/a.webp' },
      { id: 'b', colorway: 'Yagami Taichi', releaseYear: 2024, region: 'JP', imageUrl: '/b.webp' },
    ],
  },
  {
    id: 'pen-color-1-nature-spirits',
    name: 'Digimon Pendulum COLOR 1 Nature Spirits',
    line: 'Pendulum',
    series: 'COLOR 1 Nature Spirits',
    releaseYear: 2023,
    variants: [
      { id: 'c', colorway: 'Original', releaseYear: 2023, region: 'JP', imageUrl: '/c.webp' },
    ],
  },
];

const defaultProps = {
  availableProducts: products,
  trackedProducts: [] as DgmTrackedProduct[],
  onAddProduct: vi.fn(),
  onClose: vi.fn(),
};

describe('AddProductModal', () => {
  it('renders the title, products, line badge, and variant count', () => {
    render(<AddProductModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /add product/i })).toBeInTheDocument();
    expect(screen.getByText('Digivice -25th COLOR EVOLUTION-')).toBeInTheDocument();
    expect(screen.getByText('Digivice').className).toBe(
      'game-badge dgm-line-badge dgm-line-digivice',
    );
    expect(screen.getByText('2 variants')).toBeInTheDocument();
    expect(screen.getByText('1 variant')).toBeInTheDocument();
  });

  it('uses the first variant image for the list avatar', () => {
    render(<AddProductModal {...defaultProps} />);
    expect(screen.getByAltText('Digivice -25th COLOR EVOLUTION-')).toHaveAttribute(
      'src',
      '/a.webp',
    );
  });

  it('finds a product by variant colourway', async () => {
    const user = userEvent.setup();
    render(<AddProductModal {...defaultProps} />);
    await user.type(screen.getByPlaceholderText(/search/i), 'Yagami');
    expect(screen.getByText('Digivice -25th COLOR EVOLUTION-')).toBeInTheDocument();
    expect(screen.queryByText(/Pendulum COLOR 1/)).not.toBeInTheDocument();
  });

  it('excludes tracked products and adds the catalog product', async () => {
    const user = userEvent.setup();
    const onAddProduct = vi.fn();
    render(
      <AddProductModal
        {...defaultProps}
        trackedProducts={[
          { ...products[1], isFavorited: false, notes: '', progress: [], variantState: {} },
        ]}
        onAddProduct={onAddProduct}
      />,
    );
    expect(screen.queryByText(/Pendulum COLOR 1/)).not.toBeInTheDocument();
    await user.click(screen.getByText('Digivice -25th COLOR EVOLUTION-'));
    expect(onAddProduct).toHaveBeenCalledWith(products[0]);
  });
});

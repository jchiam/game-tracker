import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ProductEditorModal } from './ProductEditorModal';
import type { DgmTrackedProduct } from '@/types';

const product: DgmTrackedProduct = {
  id: 'dv-25th-color-evolution',
  name: 'Digivice -25th COLOR EVOLUTION-',
  line: 'Digivice',
  series: '-25th COLOR EVOLUTION-',
  releaseYear: 2024,
  variants: [
    { id: 'anime', colorway: 'Anime Original', releaseYear: 2024, region: 'JP', imageUrl: '/a' },
    { id: 'taichi', colorway: 'Taichi', releaseYear: 2024, region: 'JP', imageUrl: '/b' },
  ],
  guide: {
    overall: 'track-mean',
    tracks: [
      {
        id: 'partners',
        label: 'Partners',
        groups: [
          {
            id: 'taichi',
            label: 'Taichi',
            items: [
              { id: 'partners:agumon', label: 'Agumon' },
              { id: 'partners:greymon', label: 'Greymon', hint: 'Wins: 5' },
              { id: 'partners:metalgreymon', label: 'MetalGreymon', hint: 'Wins: 15' },
            ],
          },
        ],
      },
      {
        id: 'map',
        label: 'Map',
        groups: [
          {
            id: 'file-island',
            label: 'File Island',
            items: [{ id: 'map:lake', label: 'Lake', hint: 'Boss: Seadramon' }],
          },
        ],
      },
    ],
  },
  dbId: 'db-1',
  isFavorited: false,
  notes: '',
  progress: [],
  variantState: {},
};

const owned: DgmTrackedProduct = {
  ...product,
  variantState: { anime: { status: 'owned', condition: null } },
};

function renderModal(p: DgmTrackedProduct, initialTab?: string) {
  const props = {
    onSetVariantStatus: vi.fn(),
    onSetVariantCondition: vi.fn(),
    onToggleItem: vi.fn(),
    onClose: vi.fn(),
  };
  render(<ProductEditorModal product={p} initialTab={initialTab} {...props} />);
  return props;
}

describe('ProductEditorModal', () => {
  it('opens on the Variants tab with one row per catalog variant', () => {
    renderModal(product);
    expect(screen.getByText(product.name)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Variants' })).toHaveClass('active');
    expect(screen.getAllByRole('listitem', { name: /Anime Original|Taichi/ })).toHaveLength(2);
    expect(screen.getAllByText('JP · 2024', { exact: false })).toHaveLength(2);
  });

  it('ticking a variant emits its status and shows the condition row only while owned', () => {
    const { onSetVariantStatus, onSetVariantCondition } = renderModal(owned);
    const taichi = screen.getByRole('listitem', { name: 'Taichi' });
    expect(within(taichi).queryByRole('button', { name: 'Boxed' })).not.toBeInTheDocument();
    fireEvent.click(within(taichi).getByRole('button', { name: 'Owned' }));
    expect(onSetVariantStatus).toHaveBeenCalledWith('taichi', 'owned');

    const anime = screen.getByRole('listitem', { name: 'Anime Original' });
    fireEvent.click(within(anime).getByRole('button', { name: 'Boxed' }));
    expect(onSetVariantCondition).toHaveBeenCalledWith('anime', 'boxed');
  });

  it('deselecting the active status emits null', () => {
    const { onSetVariantStatus } = renderModal(owned);
    const anime = screen.getByRole('listitem', { name: 'Anime Original' });
    fireEvent.click(within(anime).getByRole('button', { name: 'Owned' }));
    expect(onSetVariantStatus).toHaveBeenCalledWith('anime', null);
  });

  it('disables the track tabs while nothing is owned', () => {
    renderModal(product, 'partners');
    const partners = screen.getByRole('button', { name: 'Partners' });
    expect(partners).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Map' })).toBeDisabled();
    // A disabled initialTab falls back to Variants.
    expect(screen.getByRole('button', { name: 'Variants' })).toHaveClass('active');
    fireEvent.click(partners);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('opens on the requested track when owned and lists grouped items with hints', () => {
    renderModal(owned, 'map');
    expect(screen.getByRole('button', { name: 'Map' })).toHaveClass('active');
    expect(screen.getByText('File Island')).toBeInTheDocument();
    expect(screen.getByText('Boss: Seadramon')).toBeInTheDocument();
  });

  it('emits the item id on toggle and reflects checked state and group count', () => {
    const { onToggleItem } = renderModal(
      { ...owned, progress: ['partners:agumon', 'partners:greymon'] },
      'partners',
    );
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    const boxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(boxes.map((b) => b.checked)).toEqual([true, true, false]);
    fireEvent.click(screen.getByLabelText(/^MetalGreymon/));
    expect(onToggleItem).toHaveBeenCalledWith('partners:metalgreymon');
  });

  it('renders no track tabs for a product without a guide', () => {
    renderModal({ ...owned, guide: undefined });
    expect(screen.queryByRole('button', { name: 'Partners' })).not.toBeInTheDocument();
  });

  it('Done closes', () => {
    const { onClose } = renderModal(product);
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

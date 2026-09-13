import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { DigimonPage } from './DigimonPage';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { DgmTrackedProduct } from '@/types';
import { ALL_PRODUCTS } from '@/data/digimon/products';

vi.mock('@/hooks/digimon/useProducts', () => ({
  useProducts: vi.fn(),
}));

vi.mock('@/lib/imagekit', () => ({
  getDeviceImageUrl: (path: string) => path,
  getMugshotUrl: (path: string) => path,
  getAvatarUrl: (path: string) => path,
}));

import { useProducts } from '@/hooks/digimon/useProducts';

const dvc = ALL_PRODUCTS.find((p) => p.id === 'dv-25th-color-evolution')!;

function makeProduct(
  id: string,
  name: string,
  overrides: Partial<DgmTrackedProduct> = {},
): DgmTrackedProduct {
  return {
    id,
    name,
    line: 'Digital Monster',
    series: 'Ver.20th',
    releaseYear: 2017,
    variants: [
      {
        id: `${id}-v1`,
        colorway: 'Brown',
        releaseYear: 2017,
        region: 'JP',
        imageUrl: `/${id}.webp`,
      },
    ],
    dbId: `db-${id}`,
    isFavorited: false,
    notes: '',
    progress: [],
    variantState: {},
    ...overrides,
  };
}

const defaultHook = {
  availableProducts: ALL_PRODUCTS,
  trackedProducts: [] as DgmTrackedProduct[],
  isInitialLoad: false,
  isLoadError: false,
  retryLoad: vi.fn(),
  pendingSaveCount: 0,
  addProduct: vi.fn(),
  removeProduct: vi.fn(),
  updateNotes: vi.fn(),
  toggleFavorite: vi.fn(),
  updateProgress: vi.fn(),
  setVariantStatus: vi.fn(),
  setVariantCondition: vi.fn(),
  getFilteredRoster: vi.fn().mockReturnValue([]),
};

const session = createMockSession();

describe('DigimonPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useProducts).mockReturnValue(defaultHook);
  });

  it('shows sign-in check while auth is loading', () => {
    renderWithProviders(<DigimonPage session={null} isAuthLoading={true} onSignIn={vi.fn()} />);
    expect(screen.getByText(/checking sign-in/i)).toBeInTheDocument();
  });

  it('shows AuthGate when there is no session', () => {
    renderWithProviders(<DigimonPage session={null} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('shows the roster loading state during initial load', () => {
    vi.mocked(useProducts).mockReturnValue({ ...defaultHook, isInitialLoad: true });
    renderWithProviders(<DigimonPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText(/loading your roster/i)).toBeInTheDocument();
  });

  it('shows the load error state with Retry wired to retryLoad', () => {
    const retryLoad = vi.fn();
    vi.mocked(useProducts).mockReturnValue({ ...defaultHook, isLoadError: true, retryLoad });
    renderWithProviders(<DigimonPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/couldn.t load your roster/i);
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(retryLoad).toHaveBeenCalledTimes(1);
    expect(screen.getByTitle('Add Product')).toBeDisabled();
  });

  it('shows the collection empty state', () => {
    renderWithProviders(<DigimonPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText(/no products in your collection yet/i)).toBeInTheDocument();
  });

  it('renders product cards when products are tracked', () => {
    const products = [makeProduct('a', 'Alpha Product'), makeProduct('b', 'Beta Product')];
    vi.mocked(useProducts).mockReturnValue({
      ...defaultHook,
      trackedProducts: products,
      getFilteredRoster: vi.fn().mockReturnValue(products),
    });
    renderWithProviders(<DigimonPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText('Alpha Product')).toBeInTheDocument();
    expect(screen.getByText('Beta Product')).toBeInTheDocument();
  });

  it('shows the no-match message when the search filters everything out', () => {
    vi.mocked(useProducts).mockReturnValue({
      ...defaultHook,
      trackedProducts: [makeProduct('a', 'Alpha Product')],
      getFilteredRoster: vi.fn().mockReturnValue([]),
    });
    renderWithProviders(<DigimonPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText(/no products match your search/i)).toBeInTheDocument();
  });

  it('opens AddProductModal from the add button and adds the catalog product', () => {
    const addProduct = vi.fn();
    vi.mocked(useProducts).mockReturnValue({ ...defaultHook, addProduct });
    renderWithProviders(<DigimonPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Add Product'));
    expect(screen.getByRole('heading', { name: /add product/i })).toBeInTheDocument();
    fireEvent.click(screen.getByText(dvc.name));
    expect(addProduct).toHaveBeenCalledWith(dvc);
  });

  it('switches to the Completion view', () => {
    renderWithProviders(<DigimonPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /completion/i }));
    expect(screen.getByRole('region', { name: /collection completion/i })).toBeInTheDocument();
    expect(screen.getByText('All products')).toBeInTheDocument();
  });

  it('shows SavingToast when pendingSaveCount > 0', () => {
    vi.mocked(useProducts).mockReturnValue({ ...defaultHook, pendingSaveCount: 2 });
    renderWithProviders(<DigimonPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('favorite toggle releases immediately (completed intent)', () => {
    const toggleFavorite = vi.fn();
    const products = [makeProduct('a', 'Alpha Product')];
    vi.mocked(useProducts).mockReturnValue({
      ...defaultHook,
      trackedProducts: products,
      getFilteredRoster: vi.fn().mockReturnValue(products),
      toggleFavorite,
    });
    renderWithProviders(<DigimonPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Favorite Product'));
    expect(toggleFavorite).toHaveBeenCalledWith('a', true);
  });

  it('wires variant ticks and progress toggles through the hook, merging progress', () => {
    const setVariantStatus = vi.fn();
    const updateProgress = vi.fn();
    const tracked: DgmTrackedProduct = {
      ...dvc,
      dbId: 'db-dvc',
      isFavorited: false,
      notes: '',
      progress: ['partners:taichi-greymon'],
      variantState: { [dvc.variants[0].id]: { status: 'owned', condition: null } },
    };
    vi.mocked(useProducts).mockReturnValue({
      ...defaultHook,
      trackedProducts: [tracked],
      getFilteredRoster: vi.fn().mockReturnValue([tracked]),
      setVariantStatus,
      updateProgress,
    });
    renderWithProviders(<DigimonPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.click(screen.getByRole('button', { name: 'Manage' }));
    const taichiRow = screen.getByRole('listitem', { name: 'Yagami Taichi Color' });
    fireEvent.click(taichiRow.querySelector('button')!);
    expect(setVariantStatus).toHaveBeenCalledWith(dvc.id, dvc.variants[1].id, 'owned');

    fireEvent.click(screen.getByRole('button', { name: 'Partners' }));
    fireEvent.click(screen.getByLabelText(/^Metal Greymon/));
    // Merged through toggleProgressItem: Greymon already checked, Metal Greymon added.
    expect(updateProgress).toHaveBeenCalledWith(dvc.id, [
      'partners:taichi-greymon',
      'partners:taichi-metal-greymon',
    ]);
  });

  it('YEAR sort does not reorder mid-edit, reorders on commit', () => {
    const live = {
      current: [
        makeProduct('a', 'Alpha Product', { releaseYear: 2020 }),
        makeProduct('b', 'Beta Product', { releaseYear: 2010 }),
      ],
    };
    const filter = vi.fn((term: string, sortBy: string, entities?: DgmTrackedProduct[]) => {
      let list = entities ?? live.current;
      if (term.trim()) list = list.filter((p) => p.name.includes(term));
      return [...list].sort(
        sortBy === 'YEAR'
          ? (a, b) => a.releaseYear - b.releaseYear
          : (a, b) => a.name.localeCompare(b.name),
      );
    });
    const mock = () =>
      vi.mocked(useProducts).mockReturnValue({
        ...defaultHook,
        trackedProducts: live.current,
        getFilteredRoster: filter,
      });
    mock();
    const { rerender, container } = renderWithProviders(
      <DigimonPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByTitle(/sorted alphabetically/i));
    const names = () =>
      [...container.querySelectorAll('.game-card-name')].map((n) => n.textContent);
    expect(names()).toEqual(['Beta Product', 'Alpha Product']);
    fireEvent.click(screen.getAllByTitle('Edit')[1]);
    live.current = [
      makeProduct('a', 'Alpha Product', { releaseYear: 2005 }),
      makeProduct('b', 'Beta Product', { releaseYear: 2010 }),
    ];
    mock();
    rerender(<DigimonPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(names()).toEqual(['Beta Product', 'Alpha Product']);
    fireEvent.click(screen.getByTitle('Done editing'));
    expect(names()).toEqual(['Alpha Product', 'Beta Product']);
  });
});

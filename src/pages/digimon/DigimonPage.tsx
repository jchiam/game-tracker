import { useProducts } from '@/hooks/digimon/useProducts';
import { useRosterView } from '@/hooks/useRosterView';
import { toggleProgressItem } from '@/pages/digimon/gameProgress';
import { ProductCard } from './components/ProductCard';
import { AddProductModal } from './components/AddProductModal';
import { CompletionView } from './components/CompletionView';
import { RosterPageLayout } from '@/components/RosterPageLayout';
import type { Session } from '@supabase/supabase-js';
import './DigimonPage.css';

interface DigimonPageProps {
  session: Session | null;
  isAuthLoading: boolean;
  onSignIn: () => void;
}

export function DigimonPage({ session, isAuthLoading, onSignIn }: DigimonPageProps) {
  const {
    availableProducts,
    trackedProducts,
    isInitialLoad,
    isLoadError,
    retryLoad,
    pendingSaveCount,
    addProduct,
    removeProduct,
    updateNotes,
    toggleFavorite,
    updateProgress,
    setVariantCopies,
    setVariantWishlist,
    getFilteredRoster,
  } = useProducts(session, isAuthLoading);

  const {
    view,
    setView,
    filteredRoster,
    isAddModalOpen,
    closeAddModal,
    search,
    sort,
    add,
    projection,
  } = useRosterView({
    sortModes: [
      { key: 'ALPHA', label: 'AZ', described: 'alphabetically' },
      { key: 'YEAR', label: 'Yr', described: 'by release year' },
    ],
    searchPlaceholder: 'Search by name, line, series, or colour…',
    addTitle: 'Add Product',
    addDisabled: isLoadError,
    filterRoster: getFilteredRoster,
    trackedEntities: trackedProducts,
  });

  // Progress toggles merge through the pure module from the latest tracked entry.
  const toggleItem = (productId: string, itemId: string) => {
    const current = trackedProducts.find((p) => p.id === productId);
    if (!current?.guide) return;
    updateProgress(productId, toggleProgressItem(current.guide, current.progress, itemId));
  };

  return (
    <RosterPageLayout
      title="Digimon Virtual Pets"
      subtitle="Track your digivice and virtual-pet collection."
      secondViewLabel="Completion"
      view={view}
      onViewChange={setView}
      session={session}
      isAuthLoading={isAuthLoading}
      isInitialLoad={isInitialLoad}
      isLoadError={isLoadError}
      onRetry={retryLoad}
      onSignIn={onSignIn}
      hasTracked={trackedProducts.length > 0}
      hasMatches={filteredRoster.length > 0}
      emptyMessage="No products in your collection yet. Use the + button to begin!"
      noMatchMessage="No products match your search."
      search={search}
      sort={sort}
      add={add}
      cards={filteredRoster.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onRemove={removeProduct}
          onUpdateNotes={updateNotes}
          onSetVariantCopies={setVariantCopies}
          onSetVariantWishlist={setVariantWishlist}
          onToggleItem={toggleItem}
          onToggleFavorite={(id, value) => {
            // Favorite is a completed intent — release in the same handler
            toggleFavorite(id, value);
            projection.refreshBasis(id);
          }}
          onEditCommit={() => projection.refreshBasis(product.id)}
        />
      ))}
      secondView={
        <CompletionView
          trackedProducts={trackedProducts}
          session={session}
          isAuthLoading={isAuthLoading}
          isInitialLoad={isInitialLoad}
          isLoadError={isLoadError}
          onRetry={retryLoad}
          onSignIn={onSignIn}
        />
      }
      pendingSaveCount={pendingSaveCount}
    >
      {isAddModalOpen && (
        <AddProductModal
          availableProducts={availableProducts}
          trackedProducts={trackedProducts}
          onAddProduct={addProduct}
          onClose={closeAddModal}
        />
      )}
    </RosterPageLayout>
  );
}

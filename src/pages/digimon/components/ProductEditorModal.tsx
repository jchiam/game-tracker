import type { DgmProgressGroup } from '@/data/digimon/products';
import type { DgmCondition, DgmTrackedProduct } from '@/types';
import { Stepper } from '@/components/Stepper';
import { ToggleChips } from '@/components/ToggleChips';
import { TabbedEditorShell, type EditorTab } from '@/components/TabbedEditorShell';
import { deriveOwnership, isPlayable } from '@/pages/digimon/ownership';
import './ProductEditorModal.css';

const CONDITIONS: readonly { value: DgmCondition; label: string }[] = [
  { value: 'sealed', label: 'Sealed' },
  { value: 'boxed', label: 'Boxed' },
  { value: 'loose', label: 'Loose' },
];

const WISHLIST_OPTIONS = [
  { value: 'wishlist', label: 'Wishlist', modifier: 'dgm-status-wishlist' },
] as const;

const EMPTY_COPIES = { sealed: 0, boxed: 0, loose: 0 };

export const VARIANTS_TAB = 'variants';

interface ProductEditorModalProps {
  product: DgmTrackedProduct;
  /** Tab to open on: `VARIANTS_TAB` or a guide track id. */
  initialTab?: string;
  onSetVariantCopies: (variantId: string, condition: DgmCondition, count: number) => void;
  onSetVariantWishlist: (variantId: string, wishlist: boolean) => void;
  /** Fired with the clicked progress item id; the caller applies `toggleProgressItem`. */
  onToggleItem: (itemId: string) => void;
  onClose: () => void;
}

/**
 * The product editor: a Variants tab (per-variant copy counts per condition
 * and an independent wishlist flag) followed by one tab per progress track.
 * Track tabs are disabled until some copy is playable — a sealed copy cannot
 * run, so progress belongs to an opened one. State stays with the caller;
 * this modal only reports clicks.
 */
export function ProductEditorModal({
  product,
  initialTab,
  onSetVariantCopies,
  onSetVariantWishlist,
  onToggleItem,
  onClose,
}: ProductEditorModalProps) {
  const playable = isPlayable(product);
  const sealedOnly = !playable && deriveOwnership(product) === 'owned';
  const checked = new Set(product.progress);

  const variantsTab: EditorTab = {
    id: VARIANTS_TAB,
    label: 'Variants',
    content: (
      <>
        <ul className="variant-list">
          {product.variants.map((variant) => {
            const state = product.variantState[variant.id];
            const copies = state?.copies ?? EMPTY_COPIES;
            return (
              <li key={variant.id} className="variant-row" aria-label={variant.colorway}>
                <div className="variant-row-header">
                  <span className="variant-row-name">{variant.colorway}</span>
                  <span className="variant-row-meta">
                    {variant.region} · {variant.releaseYear}
                  </span>
                </div>
                <div className="variant-row-controls">
                  {CONDITIONS.map((c) => (
                    <Stepper
                      key={c.value}
                      label={c.label}
                      value={copies[c.value]}
                      size="compact"
                      onChange={(next) => onSetVariantCopies(variant.id, c.value, next)}
                    />
                  ))}
                  <ToggleChips
                    name={`wishlist-${product.id}-${variant.id}`}
                    options={WISHLIST_OPTIONS}
                    values={state?.wishlist ? ['wishlist'] : []}
                    size="compact"
                    className="variant-row-wishlist"
                    onToggle={() => onSetVariantWishlist(variant.id, !state?.wishlist)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        {sealedOnly && <p className="product-editor-hint">Open a copy to track progress.</p>}
      </>
    ),
  };

  const renderGroup = (group: DgmProgressGroup) => {
    const done = group.items.filter((i) => checked.has(i.id)).length;
    return (
      <section key={group.id} className="progress-group" aria-label={group.label}>
        <header className="progress-group-header">
          <span className="progress-group-label">{group.label}</span>
          <span className="progress-group-count">
            {done} / {group.items.length}
          </span>
        </header>
        <ul className="progress-items">
          {group.items.map((item) => (
            <li key={item.id}>
              <label className={`progress-item ${checked.has(item.id) ? 'is-checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked.has(item.id)}
                  onChange={() => onToggleItem(item.id)}
                />
                <span className="progress-item-label">{item.label}</span>
                {item.hint && <span className="progress-item-hint">{item.hint}</span>}
              </label>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  const trackTabs: EditorTab[] = (product.guide?.tracks ?? []).map((track) => ({
    id: track.id,
    label: track.label,
    disabled: !playable,
    content: <>{track.groups.map(renderGroup)}</>,
  }));

  return (
    <TabbedEditorShell
      title={product.name}
      bodyClassName="product-editor-body"
      initialTab={initialTab}
      onClose={onClose}
      tabs={[variantsTab, ...trackTabs]}
    />
  );
}

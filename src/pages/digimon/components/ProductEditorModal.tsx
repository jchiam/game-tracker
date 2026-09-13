import type { DgmProgressGroup } from '@/data/digimon/products';
import type { DgmCondition, DgmTrackedProduct, DgmVariantStatus } from '@/types';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { TabbedEditorShell, type EditorTab } from '@/components/TabbedEditorShell';
import { deriveOwnership } from '@/pages/digimon/ownership';
import './ProductEditorModal.css';

const STATUS_OPTIONS = [
  { value: 'owned', label: 'Owned', modifier: 'dgm-status-owned' },
  { value: 'wishlist', label: 'Wishlist', modifier: 'dgm-status-wishlist' },
] as const;

const CONDITION_OPTIONS = [
  { value: 'sealed', label: 'Sealed', modifier: 'dgm-condition' },
  { value: 'boxed', label: 'Boxed', modifier: 'dgm-condition' },
  { value: 'loose', label: 'Loose', modifier: 'dgm-condition' },
] as const;

export const VARIANTS_TAB = 'variants';

interface ProductEditorModalProps {
  product: DgmTrackedProduct;
  /** Tab to open on: `VARIANTS_TAB` or a guide track id. */
  initialTab?: string;
  onSetVariantStatus: (variantId: string, status: DgmVariantStatus | null) => void;
  onSetVariantCondition: (variantId: string, condition: DgmCondition | null) => void;
  /** Fired with the clicked progress item id; the caller applies `toggleProgressItem`. */
  onToggleItem: (itemId: string) => void;
  onClose: () => void;
}

/**
 * The product editor: a Variants tab (per-variant owned / wishlist and
 * condition) followed by one tab per progress track. Track tabs are disabled
 * until at least one variant is owned — progress belongs to a product you
 * have. State stays with the caller; this modal only reports clicks.
 */
export function ProductEditorModal({
  product,
  initialTab,
  onSetVariantStatus,
  onSetVariantCondition,
  onToggleItem,
  onClose,
}: ProductEditorModalProps) {
  const owned = deriveOwnership(product) === 'owned';
  const checked = new Set(product.progress);

  const variantsTab: EditorTab = {
    id: VARIANTS_TAB,
    label: 'Variants',
    content: (
      <ul className="variant-list">
        {product.variants.map((variant) => {
          const state = product.variantState[variant.id];
          return (
            <li key={variant.id} className="variant-row" aria-label={variant.colorway}>
              <div className="variant-row-header">
                <span className="variant-row-name">{variant.colorway}</span>
                <span className="variant-row-meta">
                  {variant.region} · {variant.releaseYear}
                </span>
              </div>
              <SegmentedButtons
                name={`status-${product.id}-${variant.id}`}
                options={STATUS_OPTIONS}
                value={state?.status ?? null}
                coloring="static"
                allowDeselect
                size="compact"
                onChange={(v) => onSetVariantStatus(variant.id, (v as DgmVariantStatus) ?? null)}
              />
              {state?.status === 'owned' && (
                <SegmentedButtons
                  name={`condition-${product.id}-${variant.id}`}
                  options={CONDITION_OPTIONS}
                  value={state.condition}
                  coloring="static"
                  allowDeselect
                  size="compact"
                  onChange={(v) => onSetVariantCondition(variant.id, (v as DgmCondition) ?? null)}
                />
              )}
            </li>
          );
        })}
      </ul>
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
    disabled: !owned,
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

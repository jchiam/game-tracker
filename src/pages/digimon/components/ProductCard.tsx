import { useState } from 'react';
import type { DgmCondition, DgmOwnership, DgmTrackedProduct, DgmVariantStatus } from '@/types';
import { BuildComments } from '@/components/BuildComments';
import { GameBadge } from '@/components/GameBadge';
import { GameCardShell } from '@/components/GameCardShell';
import { ProgressSection } from '@/components/ProgressSection';
import { StatChip } from '@/components/StatChip';
import { getDeviceImageUrl } from '@/lib/imagekit';
import { getProgressStyle } from '@/utils/progressGradient';
import { lineModifier } from '@/pages/digimon/lineModifier';
import {
  deriveOwnership,
  ownedVariantCount,
  representativeVariant,
} from '@/pages/digimon/ownership';
import { computeProgress } from '@/pages/digimon/gameProgress';
import { ProductEditorModal, VARIANTS_TAB } from './ProductEditorModal';
import '@/pages/digimon/completion.css';
import './ProductCard.css';

const OWNERSHIP_LABEL: Record<DgmOwnership, string> = {
  owned: 'Owned',
  wishlist: 'Wishlist',
  interested: 'Interested',
};

const DOT: Record<DgmVariantStatus | 'none', string> = { owned: '●', wishlist: '◐', none: '○' };

interface ProductCardProps {
  product: DgmTrackedProduct;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onToggleFavorite: (id: string, value: boolean) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onSetVariantStatus: (id: string, variantId: string, status: DgmVariantStatus | null) => void;
  onSetVariantCondition: (id: string, variantId: string, condition: DgmCondition | null) => void;
  onToggleItem: (id: string, itemId: string) => void;
  /** Projection-stability release point — fired on the ✓ edit collapse and on editor close. */
  onEditCommit?: () => void;
}

/**
 * One card per product: ownership first (chip, variant dots), then game
 * progress once a variant is owned and the product has a guide (header
 * percentage, one bar per track). Variants and progress are edited in
 * `ProductEditorModal`, never inline.
 */
export function ProductCard({
  product,
  onRemove,
  onToggleFavorite,
  onUpdateNotes,
  onSetVariantStatus,
  onSetVariantCondition,
  onToggleItem,
  onEditCommit,
}: ProductCardProps) {
  const [editorTab, setEditorTab] = useState<string | null>(null);
  const ownership = deriveOwnership(product);
  const owned = ownedVariantCount(product);
  const showProgress = ownership === 'owned' && !!product.guide;
  const summary = showProgress ? computeProgress(product.guide!, product.progress) : null;

  const dotLine = (
    <span className="variant-dots" aria-label="Variants">
      {product.variants.map((v) => {
        const status = product.variantState[v.id]?.status ?? 'none';
        return (
          <span key={v.id} className={`variant-dot variant-dot-${status}`} title={v.colorway}>
            {DOT[status]}
          </span>
        );
      })}
    </span>
  );

  const trackLines = summary
    ? summary.tracks.map((t) => (
        <span key={t.id} className="product-track-line">
          <span className="product-track-label">{t.label}</span>
          <span
            className="completion-bar"
            role="progressbar"
            aria-label={`${t.label} progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={t.percent}
          >
            <span className="completion-bar-fill" style={{ width: `${t.percent}%` }} />
          </span>
        </span>
      ))
    : [];

  return (
    <>
      <GameCardShell
        name={product.name}
        imageUrl={representativeVariant(product).imageUrl}
        resolveImage={getDeviceImageUrl}
        entityNoun="Product"
        isFavorited={product.isFavorited}
        onToggleFavorite={(value) => onToggleFavorite(product.id, value)}
        onRemove={(e) => onRemove(product.id, e)}
        onEditCommit={onEditCommit}
        badges={
          <GameBadge
            label={product.line}
            variant="dgm-line"
            modifier={lineModifier(product.line)}
          />
        }
        headerExtra={
          summary && (
            <div className="score-badge product-progress-badge">
              <span className="score-badge-readout">
                <span
                  className="score-badge-value"
                  style={{ color: getProgressStyle(summary.overall, 0, 100).color }}
                >
                  {summary.overall}%
                </span>
              </span>
            </div>
          )
        }
        summaryStats={
          <>
            <StatChip
              label={OWNERSHIP_LABEL[ownership]}
              className={`dgm-status-chip dgm-status-chip-${ownership}`}
            />
            <StatChip label={`${owned} / ${product.variants.length}`} />
            <StatChip label={String(product.releaseYear)} />
          </>
        }
        summaryLine={[dotLine, ...trackLines]}
        editBody={
          <>
            {/* One entry point; the editor's tabs are the navigation. Lives in a
                section so the shared button's hover lift is never the first thing
                against the edit body's overflow clip. */}
            <ProgressSection label="Variants & progress">
              <button className="btn secondary-action" onClick={() => setEditorTab(VARIANTS_TAB)}>
                Manage
              </button>
            </ProgressSection>
            <BuildComments
              label="Notes"
              value={product.notes}
              placeholder="Where it came from, box contents, mods…"
              onChange={(v) => onUpdateNotes(product.id, v)}
            />
          </>
        }
      />
      {editorTab && (
        <ProductEditorModal
          product={product}
          initialTab={editorTab}
          onSetVariantStatus={(variantId, status) =>
            onSetVariantStatus(product.id, variantId, status)
          }
          onSetVariantCondition={(variantId, condition) =>
            onSetVariantCondition(product.id, variantId, condition)
          }
          onToggleItem={(itemId) => onToggleItem(product.id, itemId)}
          onClose={() => {
            setEditorTab(null);
            onEditCommit?.();
          }}
        />
      )}
    </>
  );
}

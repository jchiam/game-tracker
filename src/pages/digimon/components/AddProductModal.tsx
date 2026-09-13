import type { DgmProduct } from '@/data/digimon/products';
import type { DgmTrackedProduct } from '@/types';
import { AddEntityModal } from '@/components/AddEntityModal';
import { getDeviceImageUrl } from '@/lib/imagekit';
import { lineModifier } from '@/pages/digimon/lineModifier';

interface AddProductModalProps {
  availableProducts: DgmProduct[];
  trackedProducts: DgmTrackedProduct[];
  onAddProduct: (product: DgmProduct) => void;
  onClose: () => void;
}

/** Picks a product; variants are ticked afterwards in the product editor. */
export function AddProductModal({
  availableProducts,
  trackedProducts,
  onAddProduct,
  onClose,
}: AddProductModalProps) {
  return (
    <AddEntityModal
      title="Add Product"
      entityNoun="products"
      available={availableProducts.map((p) => ({ ...p, imageUrl: p.variants[0].imageUrl }))}
      tracked={trackedProducts}
      searchKeys={['name', 'line', 'series', 'variants.colorway']}
      resolveImage={getDeviceImageUrl}
      getBadges={(product) => [
        { label: product.line, variant: 'dgm-line', modifier: lineModifier(product.line) },
        {
          label: `${product.variants.length} ${product.variants.length === 1 ? 'variant' : 'variants'}`,
          variant: 'dgm-count',
          modifier: 'variants',
        },
      ]}
      onAdd={({ imageUrl: _image, ...product }) => onAddProduct(product)}
      onClose={onClose}
    />
  );
}

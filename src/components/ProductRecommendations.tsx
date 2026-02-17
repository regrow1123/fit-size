import type { ClothingCategory } from '../types';
import { mockProducts } from '../data/mockProducts';
import { useTranslation } from '../i18n';

const CATEGORY_EMOJI: Record<ClothingCategory, string> = {
  tshirt: '👕', long_sleeve: '🧥', jacket: '🧥', pants: '👖', dress: '👗',
};

interface Props {
  category: ClothingCategory;
}

export default function ProductRecommendations({ category }: Props) {
  const { t } = useTranslation();
  const products = mockProducts.filter(p => p.category.includes(category));

  if (products.length === 0) return null;

  return (
    <div className="mt-8 max-w-4xl mx-auto px-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        {t('product.title')}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {products.map(product => (
          <div
            key={product.id}
            className={`relative bg-white rounded-xl shadow-sm border overflow-hidden transition hover:shadow-md ${
              product.sponsored ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'
            }`}
          >
            {product.sponsored && (
              <span className="absolute top-2 right-2 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                {t('product.ad')}
              </span>
            )}

            {/* Image placeholder */}
            <div
              className="h-32 flex items-center justify-center text-4xl"
              style={{ backgroundColor: product.imageColor + '22' }}
            >
              <span style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.15))' }}>
                {CATEGORY_EMOJI[category]}
              </span>
            </div>

            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm text-gray-800 leading-tight">
                  {product.name}
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`px-2 py-0.5 rounded-full font-medium ${
                    product.sizeMatch === 'perfect'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {product.sizeMatch === 'perfect' ? t('product.perfectFit') : t('product.goodFit')}
                </span>
                <span className="text-gray-400">{product.shop}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">
                  {product.price.toLocaleString()}{t('product.currency')}
                </span>
                <a
                  href={product.url}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                >
                  {t('product.viewProduct')}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400 mt-6 mb-4">
        {t('product.poweredBy')}
      </p>
    </div>
  );
}

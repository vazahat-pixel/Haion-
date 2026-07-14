import { useMemo, useCallback } from 'react';
import { useCMS } from '../CMSContext';
import { productsCatalogFallback } from '../../data/productsCatalogFallback';
import { productDetailsFallback } from '../../data/productDetailsFallback';

function normalizeCatalogItem(item) {
  if (!item) return null;
  return {
    ...item,
    image: item.image || item.listImage || item.images?.[0] || '',
  };
}

export function useCMSProducts() {
  const { getCollection, apiOnline } = useCMS();
  const cmsItems = getCollection('products');

  const activeCmsItems = useMemo(
    () => cmsItems.filter((p) => !p.status || p.status === 'active'),
    [cmsItems]
  );

  const getCatalog = useCallback(
    (category) => {
      const fromCms = activeCmsItems
        .filter((p) => (p.category || 'evs') === category)
        .map(normalizeCatalogItem);
      if (apiOnline) return fromCms;
      if (fromCms.length) return fromCms;
      return productsCatalogFallback[category] || [];
    },
    [activeCmsItems, apiOnline]
  );

  const getProductDetail = useCallback(
    (productId) => {
      if (!productId) return null;
      const cms = activeCmsItems.find((p) => p.id === productId);
      const fallback = productDetailsFallback[productId];
      if (!apiOnline) {
        if (cms?.specs) return { ...fallback, ...cms };
        if (cms) return { ...fallback, ...cms, images: cms.images || fallback?.images || [cms.image].filter(Boolean) };
        return fallback ?? null;
      }
      if (cms?.specs) return { ...fallback, ...cms };
      if (cms) return { ...fallback, ...cms, images: cms.images || fallback?.images || [cms.image].filter(Boolean) };
      return fallback ?? null;
    },
    [activeCmsItems, apiOnline]
  );

  const allProducts = useMemo(() => {
    if (apiOnline) return activeCmsItems;
    if (activeCmsItems.length) return activeCmsItems;
    return Object.values(productDetailsFallback);
  }, [activeCmsItems, apiOnline]);

  return { getCatalog, getProductDetail, allProducts, cmsItems };
}

export function useCMSProductDetail(productId) {
  const { getProductDetail, allProducts } = useCMSProducts();
  const details = getProductDetail(productId);
  const related = useMemo(
    () =>
      allProducts.filter(
        (p) => p.id !== productId && (p.category === details?.category || !details?.category)
      ).slice(0, 4),
    [allProducts, productId, details?.category]
  );
  return { details, related, getProductDetail };
}

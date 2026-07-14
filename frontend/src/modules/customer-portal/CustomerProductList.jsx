import { Link } from 'react-router-dom';
import { Package, Shield, Receipt, ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { formatDate } from '@/utils/format';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';

function ProductCard({ product, detailHref, warrantyHref }) {
  return (
    <Link
      to={detailHref}
      className="block rounded-xl border border-surface-3 bg-surface-1 p-4 transition-colors active:bg-surface-2 hover:border-brand-200"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Package className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium leading-snug">{product.name || product.product}</p>
            <StatusBadge status={product.warrantyStatus || product.status} size="sm" />
          </div>
          <p className="mt-1 font-mono text-xs text-[var(--color-text-secondary)]">
            S/N {product.serialNo}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--color-text-tertiary)]">
            <span className="inline-flex items-center gap-1">
              <Receipt className="h-3 w-3" /> {product.billNo}
            </span>
            {product.sku && <span>SKU {product.sku}</span>}
            {product.warrantyEnd && (
              <span className="inline-flex items-center gap-1">
                <Shield className="h-3 w-3" /> till {formatDate(product.warrantyEnd)}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]" />
      </div>
      {warrantyHref && (
        <p className="mt-3 text-xs font-medium text-brand-600">View warranty certificate →</p>
      )}
    </Link>
  );
}

export function CustomerProductList({ products = [], authenticated = false, emptyText = 'No products registered yet.' }) {
  if (!products.length) {
    return (
      <p className="rounded-xl border border-dashed border-surface-3 px-4 py-10 text-center text-sm text-[var(--color-text-secondary)]">
        {emptyText}
      </p>
    );
  }

  return (
    <div className={cn('space-y-3')}>
      {products.map((p) => {
        const id = p.warrantyId || p.id;
        const detailHref = authenticated
          ? `/customer/products/${id}`
          : `${ROUTES.PUBLIC_WARRANTY_CHECK}?bill=${encodeURIComponent(p.billNo || '')}`;
        return (
          <ProductCard
            key={id || p.serialNo}
            product={p}
            detailHref={detailHref}
            warrantyHref={!!p.billNo}
          />
        );
      })}
    </div>
  );
}

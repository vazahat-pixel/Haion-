import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesService } from '@/services/categories.service';
import { brandsService } from '@/services/brands.service';
import { queryKeys } from '@/services/api/queryKeys';
import { productsService } from '@/services/products.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { productColumns, productDetailFields, GST_RATE_OPTIONS } from './columns.config';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { FileUploadField } from '@/components/data-entry/FileUploadField';
import { toast } from '@/utils/toast';
import { ProductsEmptyIllustration } from '@/components/illustrations';

export const ProductTable = createListTable({
  service: productsService,
  queryKey: queryKeys.products.list,
  columns: productColumns,
  basePath: '/admin/products',
  emptyTitle: 'No items',
  emptyDescription: 'Add your first item to the catalog.',
  emptyIllustration: ProductsEmptyIllustration,
  searchKeys: ['sku', 'name', 'category', 'brand', 'hsn'],
  filterKey: 'status',
  filterOptions: [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
  ],
  searchPlaceholder: 'Search items…',
});

export const ProductDetail = createDetailView({
  service: productsService,
  queryKey: queryKeys.products.detail,
  fields: productDetailFields,
});

const productSchema = z.object({
  sku: z.string().min(1, 'SKU required'),
  name: z.string().min(2, 'Name required'),
  category: z.string().min(1, 'Category required'),
  brand: z.string().min(1, 'Brand required'),
  hsn: z.string().min(4, 'HSN required'),
  gstRate: z.coerce.number().refine((v) => [0, 5, 12, 18, 28].includes(v), 'Select GST rate'),
  imageUrl: z.string().optional(),
});

export function ProductDrawer({ open, onOpenChange }) {
  const qc = useQueryClient();
  const [imageUrl, setImageUrl] = useState('');
  const { data: catRes } = useQuery({ queryKey: ['categories', 'product-form'], queryFn: () => categoriesService.getList({ perPage: 50 }) });
  const { data: brandRes } = useQuery({ queryKey: ['brands', 'product-form'], queryFn: () => brandsService.getList({ perPage: 50 }) });
  const categoryOptions = (catRes?.data || []).map((c) => ({ value: c.name, label: c.name }));
  const brandOptions = (brandRes?.data || []).map((b) => ({ value: b.name, label: b.name }));
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: { sku: '', name: '', category: 'Motors', brand: 'Haion', hsn: '', gstRate: 18 },
  });

  const submit = async (data) => {
    try {
      await productsService.create({ ...data, imageUrl: imageUrl || undefined });
      toast.success('Item created');
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
      reset();
      setImageUrl('');
      onOpenChange?.(false);
    } catch {
      toast.error('Failed to create item');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Add Item" description="Create a new catalog item">
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div><Label>SKU</Label><Input {...register('sku')} />{errors.sku && <p className="text-xs text-[var(--color-danger)]">{errors.sku.message}</p>}</div>
        <div><Label>Item Name</Label><Input {...register('name')} />{errors.name && <p className="text-xs text-[var(--color-danger)]">{errors.name.message}</p>}</div>
        <div><Label>Category</Label>
          <Select {...register('category')}>
            {(categoryOptions.length ? categoryOptions : [{ value: 'Motors', label: 'Motors' }]).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
        <div><Label>Brand</Label>
          <Select {...register('brand')}>
            {(brandOptions.length ? brandOptions : [{ value: 'Haion', label: 'Haion' }]).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
        <div><Label>HSN Code</Label><Input {...register('hsn')} />{errors.hsn && <p className="text-xs text-[var(--color-danger)]">{errors.hsn.message}</p>}</div>
        <div><Label>GST Rate</Label>
          <Select {...register('gstRate')}>
            {GST_RATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
          {errors.gstRate && <p className="text-xs text-[var(--color-danger)]">{errors.gstRate.message}</p>}
        </div>
        <FileUploadField label="Item Image" value={imageUrl} onChange={setImageUrl} accept="image/*" />
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">{isSubmitting ? 'Saving…' : 'Create Item'}</Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
        </div>
      </form>
    </Sheet>
  );
}

const editSchema = z.object({
  name: z.string().min(2, 'Name required'),
  category: z.string().min(1, 'Category required'),
  brand: z.string().min(1, 'Brand required'),
  hsn: z.string().min(4, 'HSN required'),
  gstRate: z.coerce.number().refine((v) => [0, 5, 12, 18, 28].includes(v), 'Select GST rate'),
  imageUrl: z.string().optional(),
});

export function ProductEditDrawer({ productId, open, onOpenChange }) {
  const qc = useQueryClient();
  const [imageUrl, setImageUrl] = useState('');
  const { data: product } = useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: () => productsService.getDetail(productId),
    enabled: Boolean(productId) && open,
  });
  const { data: catRes } = useQuery({ queryKey: ['categories', 'product-edit'], queryFn: () => categoriesService.getList({ perPage: 50 }) });
  const { data: brandRes } = useQuery({ queryKey: ['brands', 'product-edit'], queryFn: () => brandsService.getList({ perPage: 50 }) });
  const categoryOptions = (catRes?.data || []).map((c) => ({ value: c.name, label: c.name }));
  const brandOptions = (brandRes?.data || []).map((b) => ({ value: b.name, label: b.name }));
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: { name: '', category: '', brand: '', hsn: '', gstRate: 18, imageUrl: '' },
  });

  useEffect(() => {
    if (!product || !open) return;
    const brand = product.brand || product.description?.split(' · ')?.[0] || '';
    reset({
      name: product.name,
      category: product.category,
      brand,
      hsn: product.hsn || product.hsnCode || '',
      gstRate: product.gstRate ?? 18,
      imageUrl: product.imageUrl || '',
    });
    setImageUrl(product.imageUrl || '');
  }, [product, open, reset]);

  const submit = async (data) => {
    try {
      await productsService.update(productId, { ...data, imageUrl: imageUrl || null });
      toast.success('Item updated');
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
      onOpenChange?.(false);
    } catch {
      toast.error('Failed to update item');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Edit Item" description={product?.sku ? `SKU ${product.sku}` : 'Update catalog item'}>
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div><Label>Item Name</Label><Input {...register('name')} />{errors.name && <p className="text-xs text-[var(--color-danger)]">{errors.name.message}</p>}</div>
        <div><Label>Category</Label>
          <Select {...register('category')}>
            {(categoryOptions.length ? categoryOptions : [{ value: product?.category || 'Motors', label: product?.category || 'Motors' }]).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
        <div><Label>Brand</Label>
          <Select {...register('brand')}>
            {(brandOptions.length ? brandOptions : [{ value: 'Haion', label: 'Haion' }]).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
        <div><Label>HSN Code</Label><Input {...register('hsn')} /></div>
        <div><Label>GST Rate</Label>
          <Select {...register('gstRate')}>
            {GST_RATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
          {errors.gstRate && <p className="text-xs text-[var(--color-danger)]">{errors.gstRate.message}</p>}
        </div>
        <FileUploadField label="Item Image" value={imageUrl} onChange={setImageUrl} accept="image/*" />
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">{isSubmitting ? 'Saving…' : 'Save Changes'}</Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
        </div>
      </form>
    </Sheet>
  );
}

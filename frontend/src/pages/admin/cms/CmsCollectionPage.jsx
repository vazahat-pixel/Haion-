import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cmsAdminService } from '@/services/cms.service';
import { toast } from '@/utils/toast';
import { notifyCmsUpdated } from '@/utils/cmsSync';
import { CmsCollectionItemDrawer } from '@/components/admin/cms/CmsCollectionItemDrawer';

export default function CmsCollectionPage() {
  const { collection } = useParams();
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['cms', 'admin', 'collection', collection],
    queryFn: () => cmsAdminService.listCollection(collection),
    enabled: !!collection,
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => cmsAdminService.toggleCollectionItem(collection, id),
    onSuccess: () => {
      toast.success('Item updated');
      qc.invalidateQueries({ queryKey: ['cms'] });
      notifyCmsUpdated();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => cmsAdminService.deleteCollectionItem(collection, id),
    onSuccess: () => {
      toast.success('Item deleted');
      qc.invalidateQueries({ queryKey: ['cms'] });
      notifyCmsUpdated();
    },
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (editingItem?.id) {
        return cmsAdminService.updateCollectionItem(collection, editingItem.id, payload);
      }
      return cmsAdminService.createCollectionItem(collection, payload);
    },
    onSuccess: () => {
      toast.success('Saved');
      qc.invalidateQueries({ queryKey: ['cms'] });
      notifyCmsUpdated();
      setDrawerOpen(false);
      setEditingItem(null);
    },
    onError: (err) => toast.error(err?.message || 'Save failed'),
  });

  const title = collection?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const openCreate = () => {
    setEditingItem(null);
    setDrawerOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setDrawerOpen(true);
  };

  return (
    <PageShell
      title={title}
      subtitle={`Collection: ${collection}`}
      actions={
        <Button onClick={openCreate}>Add Item</Button>
      }
    >
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-3">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left">
              <tr>
                <th className="p-3">Title / Name</th>
                <th className="p-3">Order</th>
                <th className="p-3">Visible</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-surface-3">
                  <td className="p-3">
                    {item.data?.title || item.data?.name || item.data?.question || item.data?.label || item.id}
                  </td>
                  <td className="p-3">{item.order}</td>
                  <td className="p-3">
                    <Switch
                      checked={item.isVisible !== false}
                      onCheckedChange={() => toggleMutation.mutate(item.id)}
                    />
                  </td>
                  <td className="p-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Delete this item?')) deleteMutation.mutate(item.id);
                      }}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CmsCollectionItemDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        item={editingItem}
        collection={collection}
        saving={saveMutation.isPending}
        onSave={(payload) => saveMutation.mutate(payload)}
      />
    </PageShell>
  );
}

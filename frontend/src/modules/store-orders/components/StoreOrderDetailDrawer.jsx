import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/utils/format';
import { storeAdminService } from '@/services/storeAdmin.service';
import { useStoreOrderDetail } from '../queries/useStoreOrders';
import { toast } from '@/utils/toast';

const NEXT_STATUS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED'],
};

export function StoreOrderDetailDrawer({ orderId, open, onOpenChange }) {
  const qc = useQueryClient();
  const { data: order, isLoading } = useStoreOrderDetail(orderId);

  const statusMutation = useMutation({
    mutationFn: ({ status }) => storeAdminService.updateStatus(orderId, { status }),
    onSuccess: () => {
      toast.success('Order status updated');
      qc.invalidateQueries({ queryKey: ['store-orders'] });
    },
    onError: (err) => toast.error(err?.message || 'Update failed'),
  });

  const nextOptions = order ? NEXT_STATUS[order.status] || [] : [];

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={order ? `Order ${order.orderNo}` : 'Order details'}
    >
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {order && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge>{order.status}</Badge>
            <Badge variant="neutral">{order.paymentMethod === 'razorpay' ? 'Online' : 'COD'}</Badge>
            <Badge variant="outline">{order.paymentStatus}</Badge>
          </div>

          <div className="text-sm space-y-1">
            <p><strong>Customer:</strong> {order.customerName}</p>
            <p><strong>Phone:</strong> {order.phone}</p>
            <p><strong>Address:</strong> {order.shippingAddress}</p>
            <p><strong>Placed:</strong> {formatDate(order.placedAt)}</p>
            <p><strong>Total:</strong> {formatCurrency(order.total)}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Items</h4>
            <ul className="space-y-2">
              {(order.lineItems || []).map((item) => (
                <li key={`${item.productId}-${item.color}`} className="flex gap-3 text-sm border rounded-lg p-2">
                  {item.image && <img src={item.image} alt="" className="w-12 h-12 object-contain rounded bg-zinc-50" />}
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity} · {formatCurrency(item.amount)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {order.timeline?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Timeline</h4>
              <ul className="space-y-2 text-xs">
                {order.timeline.map((t, i) => (
                  <li key={i} className="border-l-2 border-amber-400 pl-3">
                    <p className="font-medium">{t.title}</p>
                    <p className="text-muted-foreground">{formatDate(t.at)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {nextOptions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {nextOptions.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={status === 'CANCELLED' ? 'destructive' : 'default'}
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ status })}
                >
                  Mark {status.replace('_', ' ')}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

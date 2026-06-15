import { queryKeys } from '@/services/api/queryKeys';
import { ordersService } from '@/services/orders.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { orderColumns, orderDetailFields } from './columns.config';

export const OrderTable = createListTable({
  service: ordersService,
  queryKey: queryKeys.orders.list,
  columns: orderColumns,
  basePath: '/customer/orders',
});

export const OrderDetail = createDetailView({
  service: ordersService,
  queryKey: queryKeys.orders.detail,
  fields: orderDetailFields,
});

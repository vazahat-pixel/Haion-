import { queryKeys } from '@/services/api/queryKeys';
import { serviceRequestsService } from '@/services/serviceRequests.service';
import { warrantyService } from '@/services/warranty.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { serviceRequestColumns, serviceRequestDetailFields } from './columns.config';
import { FormCard } from '@/components/data-entry/FormCard';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/feedback/LoadingState';

export const ServiceRequestTable = createListTable({
  service: serviceRequestsService,
  queryKey: queryKeys.serviceRequests.list,
  columns: serviceRequestColumns,
  basePath: '/customer/service-requests',
});

export const ServiceRequestDetail = createDetailView({
  service: serviceRequestsService,
  queryKey: queryKeys.serviceRequests.detail,
  fields: serviceRequestDetailFields,
});

const srSchema = z.object({
  product: z.string().min(2, 'Select a product'),
  serialNo: z.string().optional(),
  billNo: z.string().optional(),
  issue: z.string().min(10, 'Describe the issue (min 10 characters)'),
  estimatedCompletion: z.string().optional(),
});

export function ServiceRequestCreateForm() {
  const navigate = useNavigate();

  const { data: warranties, isLoading } = useQuery({
    queryKey: queryKeys.warranty.list({ limit: 50 }),
    queryFn: () => warrantyService.getList({ limit: 50 }),
  });

  const rows = warranties?.data ?? warranties ?? [];
  const productOptions = [...new Map(
    rows.map((w) => [w.product, { value: w.product, label: w.product, serialNo: w.serialNo, billNo: w.billNo }])
  ).values()];

  if (isLoading) return <LoadingState message="Loading your products…" />;

  return (
    <FormCard
      title="New Service Request"
      schema={srSchema}
      defaultValues={{ product: '', serialNo: '', billNo: '', issue: '', estimatedCompletion: '' }}
      fields={[
        {
          name: 'product',
          label: 'Product',
          type: 'select',
          options: productOptions.length
            ? productOptions
            : [{ value: '', label: 'No registered products — enter details below', disabled: true }],
        },
        { name: 'serialNo', label: 'Serial Number (optional)', placeholder: 'From product label' },
        { name: 'billNo', label: 'Bill Number (optional)', placeholder: 'Invoice / bill number' },
        { name: 'issue', label: 'Describe the Issue', type: 'textarea', fullWidth: true, rows: 4 },
        { name: 'estimatedCompletion', label: 'Preferred Visit Date', type: 'date' },
      ]}
      onSubmit={async (data) => {
        const selected = productOptions.find((p) => p.value === data.product);
        await serviceRequestsService.create({
          product: data.product,
          issue: data.issue,
          serialNo: data.serialNo || selected?.serialNo,
          billNo: data.billNo || selected?.billNo,
          estimatedCompletion: data.estimatedCompletion || undefined,
        });
        navigate('/customer/service-requests');
      }}
      submitLabel="Submit Request"
      onCancel={() => navigate('/customer/service-requests')}
    />
  );
}

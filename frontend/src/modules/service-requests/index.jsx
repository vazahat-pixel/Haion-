import { queryKeys } from '@/services/api/queryKeys';
import { serviceRequestsService } from '@/services/serviceRequests.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { serviceRequestColumns, serviceRequestDetailFields } from './columns.config';
import { FormCard } from '@/components/data-entry/FormCard';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

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
  product: z.string().min(2, 'Required'),
  issue: z.string().min(10, 'Describe the issue'),
  preferredDate: z.string().optional(),
});

export function ServiceRequestCreateForm() {
  const navigate = useNavigate();
  return (
    <FormCard
      title="New Service Request"
      schema={srSchema}
      defaultValues={{ product: '', issue: '', preferredDate: '' }}
      fields={[
        { name: 'product', label: 'Product', type: 'select', options: [
          { value: 'Industrial Motor 5HP', label: 'Industrial Motor 5HP' },
          { value: 'Control Panel XL', label: 'Control Panel XL' },
          { value: 'Hydraulic Pump', label: 'Hydraulic Pump' },
        ]},
        { name: 'issue', label: 'Describe the Issue', type: 'textarea', fullWidth: true, rows: 4 },
        { name: 'preferredDate', label: 'Preferred Visit Date', type: 'date' },
      ]}
      onSubmit={async (data) => {
        await serviceRequestsService.create(data);
        navigate('/customer/service-requests');
      }}
      submitLabel="Submit Request"
      onCancel={() => navigate('/customer/service-requests')}
    />
  );
}

import { queryKeys } from '@/services/api/queryKeys';
import { complaintsService } from '@/services/complaints.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { complaintColumns, complaintDetailFields } from './columns.config';
import { FormCard } from '@/components/data-entry/FormCard';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

export const ComplaintTable = createListTable({
  service: complaintsService,
  queryKey: queryKeys.complaints.list,
  columns: complaintColumns,
  basePath: '/service/complaints',
});

export const ComplaintDetail = createDetailView({
  service: complaintsService,
  queryKey: queryKeys.complaints.detail,
  fields: complaintDetailFields,
});

const complaintSchema = z.object({
  customer: z.string().min(2, 'Required'),
  product: z.string().min(2, 'Required'),
  priority: z.string().min(1, 'Required'),
  description: z.string().min(10, 'Describe the issue (min 10 chars)'),
});

export function ComplaintCreateForm() {
  const navigate = useNavigate();
  return (
    <FormCard
      title="Register Complaint"
      schema={complaintSchema}
      defaultValues={{ customer: '', product: '', priority: 'MEDIUM', description: '' }}
      fields={[
        { name: 'customer', label: 'Customer Name' },
        { name: 'product', label: 'Product', type: 'select', options: [
          { value: 'Industrial Motor 5HP', label: 'Industrial Motor 5HP' },
          { value: 'Control Panel XL', label: 'Control Panel XL' },
          { value: 'Hydraulic Pump', label: 'Hydraulic Pump' },
        ]},
        { name: 'priority', label: 'Priority', type: 'select', options: [
          { value: 'LOW', label: 'Low' },
          { value: 'MEDIUM', label: 'Medium' },
          { value: 'HIGH', label: 'High' },
          { value: 'CRITICAL', label: 'Critical' },
        ]},
        { name: 'description', label: 'Issue Description', type: 'textarea', fullWidth: true, rows: 4 },
      ]}
      onSubmit={async (data) => {
        await complaintsService.create(data);
        navigate('/service/complaints');
      }}
      submitLabel="Submit Complaint"
      onCancel={() => navigate('/service/complaints')}
    />
  );
}

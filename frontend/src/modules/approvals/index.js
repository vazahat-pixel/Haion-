import { queryKeys } from '@/services/api/queryKeys';
import { approvalsService } from '@/services/approvals.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { approvalColumns, approvalDetailFields } from './columns.config';
import { ApprovalsEmptyIllustration } from '@/components/illustrations';

function createApprovalTable(basePath) {
  return createListTable({
    service: approvalsService,
    queryKey: queryKeys.approvals.list,
    columns: approvalColumns,
    basePath,
    emptyTitle: 'No approval requests',
    emptyDescription: 'Pending discount overrides and expense claims appear here.',
    emptyIllustration: ApprovalsEmptyIllustration,
    searchKeys: ['type', 'requester'],
    filterKey: 'status',
    filterOptions: [
      { value: 'PENDING', label: 'Pending' },
      { value: 'APPROVED', label: 'Approved' },
      { value: 'REJECTED', label: 'Rejected' },
    ],
  });
}

export const ApprovalTable = createApprovalTable('/employee/approvals');
export const AdminApprovalTable = createApprovalTable('/admin/approvals');

export const ApprovalDetail = createDetailView({
  service: approvalsService,
  queryKey: queryKeys.approvals.detail,
  fields: approvalDetailFields,
});

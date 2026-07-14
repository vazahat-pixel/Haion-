import { partiesService } from '@/services/parties.service';
import { queryKeys } from '@/services/api/queryKeys';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { partyColumns, partyDetailFields, PARTY_TYPE_OPTIONS } from './columns.config';

export const PartyTable = createListTable({
  service: partiesService,
  queryKey: queryKeys.parties.list,
  columns: partyColumns,
  basePath: '/admin/parties',
  emptyTitle: 'No parties',
  emptyDescription: 'Add suppliers, dealers, customers and other parties in one place.',
  searchKeys: ['code', 'name', 'phone', 'email', 'gstin', 'pan', 'partyCategory'],
  filterKey: 'type',
  filterOptions: PARTY_TYPE_OPTIONS,
  searchPlaceholder: 'Search parties…',
});

export const PartyDetail = createDetailView({
  service: partiesService,
  queryKey: queryKeys.parties.detail,
  fields: partyDetailFields,
});

export { PartyForm } from './PartyForm';

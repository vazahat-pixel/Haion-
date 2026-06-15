import { DetailView } from '@/components/data-display/DetailView';
import { useEntityDetail } from '@/hooks/useEntityDetail';

export function createDetailView({ service, queryKey, fields, sections }) {
  function View({ id, actions }) {
    const { data, isLoading, isError, refetch } = useEntityDetail(queryKey, service.getDetail, id);
    return (
      <DetailView
        fields={fields}
        sections={sections}
        data={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        actions={actions}
      />
    );
  }
  return View;
}

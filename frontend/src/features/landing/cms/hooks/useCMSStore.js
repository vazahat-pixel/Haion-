import { useQuery } from '@tanstack/react-query';
import { cmsPublicService } from '@/services/cms.service';
import { CMS_STORE_FALLBACK } from '../cms-fallbacks';
import { pickCms } from '../cms-defaults';
import { subscribeCmsUpdated } from '@/utils/cmsSync';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useCMSStoreConfig() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return subscribeCmsUpdated(() => {
      queryClient.invalidateQueries({ queryKey: ['cms', 'page', 'store'] });
    });
  }, [queryClient]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cms', 'page', 'store'],
    queryFn: () => cmsPublicService.getPage('store'),
    staleTime: 0,
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
  });

  const section = data?.sections?.find((s) => s.sectionKey === 'store-config' && s.isVisible !== false);
  const content = !isError && section?.content ? section.content : CMS_STORE_FALLBACK;
  return {
    config: content,
    isLoading,
    get: (path, fallback) => {
      const keys = path.split('.');
      let cur = content;
      for (const k of keys) {
        cur = cur?.[k];
      }
      return pickCms(fallback, cur);
    },
  };
}

export function useCMSStoreSection(sectionKey) {
  const { data } = useQuery({
    queryKey: ['cms', 'page', 'store'],
    queryFn: () => cmsPublicService.getPage('store'),
    staleTime: 30_000,
  });

  const section = data?.sections?.find((s) => s.sectionKey === sectionKey);
  return section?.content ?? {};
}

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { cmsPublicService } from '@/services/cms.service';
import { CMS_DEFAULTS } from '../cms-defaults';
import { pickCms } from '../cms-defaults';
import { subscribeCmsUpdated } from '@/utils/cmsSync';

export function useCMSPageBundle(page) {
  const queryClient = useQueryClient();

  useEffect(() => {
    return subscribeCmsUpdated(() => {
      queryClient.invalidateQueries({ queryKey: ['cms', 'page', page] });
    });
  }, [queryClient, page]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cms', 'page', page],
    queryFn: () => cmsPublicService.getPage(page),
    staleTime: 0,
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
    enabled: !!page,
  });

  const sections = data?.sections ?? [];
  const collections = data?.collections ?? {};

  const getSection = (sectionKey, fieldDefaults = {}) => {
    const found = sections.find((s) => s.sectionKey === sectionKey && s.isVisible !== false);
    const defaults = CMS_DEFAULTS.sections?.[page]?.[sectionKey] ?? fieldDefaults;
    return {
      ...defaults,
      ...(found?.content ?? {}),
      _visible: found ? found.isVisible !== false : true,
    };
  };

  const getCollection = (key) => {
    const items = collections[key] ?? [];
    return items.filter((i) => i.isVisible !== false).map((i) => i.data ?? i);
  };

  return { page, sections, collections, getSection, getCollection, isLoading, isError, settings: data?.settings };
}

export function useCMSSection(page, sectionKey, defaults = {}) {
  const { getSection, isLoading } = useCMSPageBundle(page);
  const section = getSection(sectionKey, defaults);
  return { section, isLoading, pick: (field, fallback) => pickCms(fallback, section[field]) };
}

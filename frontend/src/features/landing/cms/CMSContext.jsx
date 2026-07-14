import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cmsPublicService } from '@/services/cms.service';
import { CMS_DEFAULTS, getCollectionData } from './cms-defaults';
import { CMS_FALLBACKS } from './cms-fallbacks';
import { applyCmsTheme } from './applyTheme';
import { productsCatalogFallback } from '../data/productsCatalogFallback';
import { productDetailsFallback } from '../data/productDetailsFallback';
import { subscribeCmsUpdated } from '@/utils/cmsSync';

const CMSContext = createContext(null);

const POLL_MS = 5_000;

function buildProductsFallback() {
  const items = [];
  for (const category of ['evs', 'appliances']) {
    for (const row of productsCatalogFallback[category] || []) {
      const detail = productDetailsFallback[row.id] || {};
      items.push({
        ...detail,
        ...row,
        category: detail.category || category,
        image: row.image || detail.images?.[0],
      });
    }
  }
  return items;
}

const PRODUCTS_FALLBACK = buildProductsFallback();

function fallbackForCollection(key) {
  if (key === 'products') return PRODUCTS_FALLBACK;
  return CMS_FALLBACKS[key] ?? [];
}

export function CMSProvider({ page = 'home', children }) {
  const queryClient = useQueryClient();
  const [maintenanceOverride] = useState(false);

  const pageQuery = useQuery({
    queryKey: ['cms', 'page', page],
    queryFn: () => cmsPublicService.getPage(page),
    staleTime: 0,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  });

  const settingsQuery = useQuery({
    queryKey: ['cms', 'settings'],
    queryFn: () => cmsPublicService.getSettings(),
    staleTime: 0,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  });

  useEffect(() => {
    return subscribeCmsUpdated(() => {
      queryClient.invalidateQueries({ queryKey: ['cms'] });
    });
  }, [queryClient]);

  const apiOnline = !pageQuery.isError && !settingsQuery.isError;
  const bundle = pageQuery.data ?? {};
  const settings = apiOnline
    ? (settingsQuery.data ?? bundle.settings ?? CMS_DEFAULTS.settings)
    : CMS_DEFAULTS.settings;
  const sections = apiOnline ? (bundle.sections ?? []) : [];
  const collections = apiOnline ? (bundle.collections ?? {}) : {};

  useEffect(() => {
    applyCmsTheme(settings.theme ?? CMS_DEFAULTS.settings.theme);
  }, [settings.theme]);

  const getSection = useCallback(
    (sectionKey) => {
      if (!apiOnline) {
        return {
          ...(CMS_DEFAULTS.sections?.[page]?.[sectionKey] ?? {}),
          ...(CMS_FALLBACKS.sections?.[sectionKey] ?? {}),
          _visible: true,
        };
      }
      const found = sections.find((s) => s.sectionKey === sectionKey && s.isVisible !== false);
      const defaults = CMS_DEFAULTS.sections?.[page]?.[sectionKey] ?? {};
      return {
        ...defaults,
        ...(found?.content ?? {}),
        _visible: found ? found.isVisible !== false : true,
        _seo: found?.seo,
      };
    },
    [sections, page, apiOnline]
  );

  const getCollection = useCallback(
    (collectionKey) => {
      if (!apiOnline) {
        return fallbackForCollection(collectionKey);
      }
      const items = collections[collectionKey] ?? [];
      const parsed = getCollectionData(Array.isArray(items) ? items : []);
      return parsed;
    },
    [collections, apiOnline]
  );

  const visibleSections = useMemo(
    () =>
      sections
        .filter((s) => s.isVisible !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [sections]
  );

  const value = useMemo(
    () => ({
      page,
      settings,
      sections,
      visibleSections,
      collections,
      apiOnline,
      isLoading: pageQuery.isLoading || settingsQuery.isLoading,
      isError: pageQuery.isError || settingsQuery.isError,
      getSection,
      getCollection,
      refresh: () => queryClient.invalidateQueries({ queryKey: ['cms'] }),
    }),
    [
      page,
      settings,
      sections,
      visibleSections,
      collections,
      apiOnline,
      pageQuery.isLoading,
      pageQuery.isError,
      settingsQuery.isLoading,
      settingsQuery.isError,
      getSection,
      getCollection,
      queryClient,
    ]
  );

  const maintenance = settings.maintenanceMode?.isEnabled && !maintenanceOverride;

  if (maintenance) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030303] text-white p-8 text-center">
        <div className="max-w-lg">
          <h1 className="text-2xl font-bold mb-4">{settings.siteName ?? 'Haion'}</h1>
          <div
            className="text-zinc-400 prose prose-invert"
            dangerouslySetInnerHTML={{
              __html:
                settings.maintenanceMode?.message ?? CMS_DEFAULTS.settings.maintenanceMode.message,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <CMSContext.Provider value={value}>
      {!apiOnline && !pageQuery.isLoading && (
        <div className="fixed bottom-4 left-4 z-[200] rounded-lg bg-amber-600/95 text-white text-xs px-3 py-2 shadow-lg max-w-xs">
          CMS offline — showing cached content. Start backend on port 3000 and refresh.
        </div>
      )}
      {children}
    </CMSContext.Provider>
  );
}

export function useCMS() {
  const ctx = useContext(CMSContext);
  if (!ctx) throw new Error('useCMS must be used within CMSProvider');
  return ctx;
}

export function useCMSSettings() {
  return useCMS().settings;
}

export function useCMSPage() {
  const { page, sections, visibleSections, getSection, isLoading, apiOnline } = useCMS();
  return { page, sections, visibleSections, getSection, isLoading, apiOnline };
}

export function useCMSCollection(key) {
  const { getCollection, isLoading, apiOnline } = useCMS();
  return { items: getCollection(key), isLoading, apiOnline };
}

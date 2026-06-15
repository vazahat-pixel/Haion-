import { create } from 'zustand';

const defaultFilters = {
  page: 1,
  perPage: 20,
  sort: 'createdAt',
  order: 'desc',
  search: '',
};

const createModuleFilters = () => ({ ...defaultFilters });

export const useFiltersStore = create((set, get) => ({
  filters: {
    inventory: createModuleFilters(),
    billing: createModuleFilters(),
    complaints: createModuleFilters(),
    dispatch: createModuleFilters(),
    dealers: createModuleFilters(),
    employees: createModuleFilters(),
    grn: createModuleFilters(),
    warranty: createModuleFilters(),
    spares: createModuleFilters(),
    returns: createModuleFilters(),
    audit: createModuleFilters(),
  },

  setFilter: (module, key, value) => {
    set({
      filters: {
        ...get().filters,
        [module]: { ...get().filters[module], [key]: value, ...(key !== 'page' ? { page: 1 } : {}) },
      },
    });
  },

  setFilters: (module, filtersObj) => {
    set({
      filters: {
        ...get().filters,
        [module]: { ...get().filters[module], ...filtersObj },
      },
    });
  },

  clearFilters: (module) => {
    set({
      filters: {
        ...get().filters,
        [module]: createModuleFilters(),
      },
    });
  },

  clearFilter: (module, key) => {
    const moduleFilters = { ...get().filters[module] };
    if (key in defaultFilters) {
      moduleFilters[key] = defaultFilters[key];
    } else {
      delete moduleFilters[key];
    }
    set({ filters: { ...get().filters, [module]: moduleFilters } });
  },

  syncFromURL: (module, searchParams) => {
    const parsed = { ...get().filters[module] };
    searchParams.forEach((value, key) => {
      if (key === 'page' || key === 'perPage') parsed[key] = Number(value);
      else parsed[key] = value;
    });
    set({ filters: { ...get().filters, [module]: parsed } });
  },

  toSearchParams: (module) => {
    const f = get().filters[module];
    const params = new URLSearchParams();
    Object.entries(f).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.set(key, String(value));
      }
    });
    return params;
  },
}));

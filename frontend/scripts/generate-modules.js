import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modulesDir = path.join(__dirname, '..', 'src', 'modules');

const modules = [
  'inventory', 'dispatch', 'grn', 'billing', 'gst', 'warranty',
  'complaints', 'spares', 'returns', 'employees', 'analytics', 'notifications',
];

const services = [
  'dispatch', 'grn', 'gst', 'warranty', 'spares', 'returns',
  'employees', 'dealers', 'warehouses', 'notifications', 'audit', 'upload',
];

for (const mod of modules) {
  const modDir = path.join(modulesDir, mod);
  fs.mkdirSync(modDir, { recursive: true });

  if (!fs.existsSync(path.join(modDir, 'columns.config.js')) && ['inventory', 'dispatch', 'grn', 'billing', 'warranty', 'complaints', 'spares', 'returns', 'employees'].includes(mod)) {
    fs.writeFileSync(path.join(modDir, 'columns.config.js'), `export const ${mod}Columns = [];\n`);
  }

  fs.writeFileSync(path.join(modDir, 'index.js'), `// ${mod} module public API
export * from './queries/use${capitalize(mod)}List';
`);

  const queriesDir = path.join(modDir, 'queries');
  fs.mkdirSync(queriesDir, { recursive: true });

  const hookName = mod === 'notifications' ? 'Notification' : capitalize(mod);
  fs.writeFileSync(path.join(queriesDir, `use${hookName}List.js`), `import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';

export function use${hookName}List(filters = {}) {
  return useQuery({
    queryKey: queryKeys.${camelCase(mod)}.list(filters),
    queryFn: async () => ({ data: [], meta: { total: 0, page: 1, perPage: 20, lastPage: 0 } }),
    staleTime: 30_000,
  });
}
`);
}

for (const svc of services) {
  const svcPath = path.join(__dirname, '..', 'src', 'services', `${svc}.service.js`);
  if (!fs.existsSync(svcPath)) {
    fs.writeFileSync(svcPath, `import client from './api/client';

export const ${svc}Service = {
  getList: async (filters) => {
    const res = await client.get('/${svc}', { params: filters });
    return res.normalized;
  },
};
`);
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function camelCase(s) {
  if (s === 'service-requests') return 'serviceRequests';
  return s;
}

// Schemas
const schemasDir = path.join(__dirname, '..', 'src', 'schemas');
const schemaFiles = ['dealer', 'inventory', 'billing', 'complaint', 'employee', 'warehouse', 'dispatch', 'grn', 'warranty', 'returns'];
for (const s of schemaFiles) {
  const p = path.join(schemasDir, `${s}.schema.js`);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, `import { z } from 'zod';

export const ${s}Schema = z.object({});
`);
  }
}

// Validators
const validatorsDir = path.join(__dirname, '..', 'src', 'validators');
fs.writeFileSync(path.join(validatorsDir, 'common.validators.js'), `import { z } from 'zod';

export const phoneValidator = z.string().regex(/^[6-9]\\d{9}$/, 'Invalid Indian mobile number');
export const gstinValidator = z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN');
export const pincodeValidator = z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid pincode');
export const panValidator = z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN');
`);

fs.writeFileSync(path.join(validatorsDir, 'address.validators.js'), `import { z } from 'zod';
import { pincodeValidator } from './common.validators';

export const addressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: pincodeValidator,
});
`);

fs.writeFileSync(path.join(validatorsDir, 'document.validators.js'), `import { z } from 'zod';

export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(5 * 1024 * 1024),
});
`);

// Types
const typesDir = path.join(__dirname, '..', 'src', 'types');
const typeFiles = ['auth', 'inventory', 'billing', 'complaints', 'employees', 'analytics', 'api'];
for (const t of typeFiles) {
  const p = path.join(typesDir, `${t}.types.js`);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, `/**\n * @typedef {Object} ${capitalize(t)}Type\n * Placeholder JSDoc type definitions for ${t} domain.\n */\n\nexport {};\n`);
  }
}

// Theme
const themeDir = path.join(__dirname, '..', 'src', 'theme');
fs.writeFileSync(path.join(themeDir, 'tokens.js'), `export const colors = { brand: {}, surface: {}, text: {}, status: {}, chart: {} };
export const spacing = {};
export const radii = { sm: '6px', md: '8px', lg: '12px', xl: '16px', full: '9999px' };
export const shadows = { sm: 'var(--shadow-sm)', md: 'var(--shadow-md)', lg: 'var(--shadow-lg)', xl: 'var(--shadow-xl)' };
export const transitions = { fast: '120ms ease', base: '200ms ease', slow: '350ms ease', dramatic: '500ms ease' };
export const zIndex = { base: 0, dropdown: 10, sticky: 20, sidebar: 30, drawer: 40, modal: 50, popover: 60, toast: 70, command: 80, max: 9999 };
export const breakpoints = { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1440px', '3xl': '1920px' };
`);

fs.writeFileSync(path.join(themeDir, 'typography.js'), `export const typeScale = {
  xs: { size: '11px', lineHeight: '16px', weight: 400 },
  sm: { size: '13px', lineHeight: '20px', weight: 400 },
  base: { size: '14px', lineHeight: '22px', weight: 400 },
  md: { size: '15px', lineHeight: '24px', weight: 500 },
  lg: { size: '17px', lineHeight: '28px', weight: 500 },
  xl: { size: '20px', lineHeight: '32px', weight: 600 },
  '2xl': { size: '24px', lineHeight: '36px', weight: 600 },
  '3xl': { size: '30px', lineHeight: '40px', weight: 700 },
  '4xl': { size: '36px', lineHeight: '48px', weight: 700 },
};
`);

fs.writeFileSync(path.join(themeDir, 'shadows.js'), `export const shadows = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
  inner: 'var(--shadow-inner, inset 0 2px 4px 0 rgb(0 0 0 / 0.05))',
  none: 'none',
};
`);

// Animations
const animDir = path.join(__dirname, '..', 'src', 'animations');
fs.writeFileSync(path.join(animDir, 'page.transitions.js'), `export { pageEnter } from './motion.config';\n`);
fs.writeFileSync(path.join(animDir, 'micro.interactions.js'), `export const microDurations = { hover: 120, focus: 120, press: 120 };\n`);

// Queries global
const queriesDir = path.join(__dirname, '..', 'src', 'queries');
fs.writeFileSync(path.join(queriesDir, 'usePaginatedQuery.js'), `import { useQuery, keepPreviousData } from '@tanstack/react-query';

export function usePaginatedQuery({ queryKey, queryFn, filters, staleTime = 30_000 }) {
  return useQuery({
    queryKey: queryKey(filters),
    queryFn: () => queryFn(filters),
    staleTime,
    placeholderData: keepPreviousData,
  });
}
`);

fs.writeFileSync(path.join(queriesDir, 'useOptimisticMutation.js'), `import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useOptimisticMutation({ mutationFn, queryKey, updater }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) => updater(old, variables));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
`);

fs.writeFileSync(path.join(queriesDir, 'useInfiniteScroll.js'), `import { useInfiniteQuery } from '@tanstack/react-query';

export function useInfiniteScroll({ queryKey, queryFn, initialPageParam = 1 }) {
  return useInfiniteQuery({
    queryKey,
    queryFn,
    initialPageParam,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.lastPage > lastPage.meta?.page ? lastPage.meta.page + 1 : undefined,
  });
}
`);

// Feature stubs
const features = ['command-palette', 'global-search', 'notifications', 'audit-log', 'export-engine', 'import-engine', 'onboarding'];
for (const f of features) {
  const fDir = path.join(__dirname, '..', 'src', 'features', f);
  fs.mkdirSync(fDir, { recursive: true });
  const indexPath = path.join(fDir, 'index.js');
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, `// ${f} feature - stub\nexport {};\n`);
  }
}

console.log('Generated module stubs, services, schemas, validators, types, theme, queries, features');

import { AdminPageMesh, MODULE_ICONS } from '@/components/illustrations/admin';

export function getAdminModuleKey(pathname = '') {
  const segment = pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean)[0];
  return segment || null;
}

export function getAdminModuleDecor(pathname) {
  const key = getAdminModuleKey(pathname);
  if (!key || key === 'dashboard') return null;
  const Icon = MODULE_ICONS[key];
  if (!Icon) return null;
  return { key, Icon, Mesh: AdminPageMesh };
}

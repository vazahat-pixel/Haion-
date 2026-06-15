import { useSidebarStore } from '@/store/sidebar.store';

export function useSidebar() {
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
  const isMobileOpen = useSidebarStore((s) => s.isMobileOpen);
  const toggleCollapse = useSidebarStore((s) => s.toggleCollapse);
  const toggleMobile = useSidebarStore((s) => s.toggleMobile);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);

  return { isCollapsed, isMobileOpen, toggleCollapse, toggleMobile, setMobileOpen };
}

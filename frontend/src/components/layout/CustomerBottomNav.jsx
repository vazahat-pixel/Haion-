import { LayoutDashboard, Shield, Headphones, Package } from 'lucide-react';
import { CustomerGlassBottomNav } from '@/components/customer/CustomerGlassBottomNav';
import { useCustomerHub } from '@/hooks/useCustomerHub';

const LINKS = [
  { to: '/customer/dashboard', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/customer/products', label: 'Products', icon: Package },
  { to: '/customer/warranty', label: 'Warranty', icon: Shield },
  { to: '/customer/service-requests', label: 'Service', icon: Headphones },
];

export function CustomerBottomNav() {
  const { hub } = useCustomerHub({ enabled: true });
  return <CustomerGlassBottomNav links={LINKS} profile={hub?.profile} layoutId="auth-nav-pill" />;
}

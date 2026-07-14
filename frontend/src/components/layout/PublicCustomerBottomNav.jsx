import { Home, Package, Shield, Headphones } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { CustomerGlassBottomNav } from '@/components/customer/CustomerGlassBottomNav';
import { loadCustomerHubSession } from '@/modules/customer-portal/CustomerAccessForm';

const LINKS = [
  { to: ROUTES.CUSTOMER_ACCESS_HUB, label: 'Home', icon: Home, end: true },
  { to: ROUTES.CUSTOMER_ACCESS_PRODUCTS, label: 'Products', icon: Package },
  { to: ROUTES.PUBLIC_WARRANTY_CHECK, label: 'Warranty', icon: Shield },
  { to: ROUTES.PUBLIC_COMPLAINT, label: 'Support', icon: Headphones },
];

export function PublicCustomerBottomNav() {
  const session = loadCustomerHubSession();
  const profile = session?.hub?.profile ?? session?.profile;
  return <CustomerGlassBottomNav links={LINKS} profile={profile} guest layoutId="guest-nav-pill" />;
}

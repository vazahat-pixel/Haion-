import { CustomerPageShell } from '@/components/layout/CustomerPageShell';
import { CustomerProductList } from '@/modules/customer-portal/CustomerProductList';
import { loadCustomerHubSession } from '@/modules/customer-portal/CustomerAccessForm';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

export default function PublicCustomerProductsPage() {
  const session = loadCustomerHubSession();
  const hub = session?.hub ?? session;
  if (!hub) return <Navigate to={ROUTES.CUSTOMER_ACCESS} replace />;

  return (
    <CustomerPageShell title="My Products" subtitle="Your purchased items & warranty">
      <CustomerProductList
        products={hub.products || hub.warranties}
        authenticated={false}
      />
    </CustomerPageShell>
  );
}

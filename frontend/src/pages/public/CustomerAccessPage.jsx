import { Link } from 'react-router-dom';
import { CustomerAccessForm } from '@/modules/customer-portal/CustomerAccessForm';
import { ROUTES } from '@/constants/routes';
import { CustomerPortalProvider } from '@/providers/CustomerPortalProvider';

export default function CustomerAccessPage() {
  return (
    <CustomerPortalProvider>
      <div className="customer-app mx-auto w-full max-w-md space-y-4 p-4 min-h-[calc(100vh-2rem)] flex flex-col justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">HAION Customer Portal</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Instant Customer ID & Bill Lookup — optimized for mobile
          </p>
        </div>
        <CustomerAccessForm />
        <p className="text-center text-xs text-[var(--color-text-tertiary)]">
          Already registered? <Link to={ROUTES.CUSTOMER_LOGIN} className="text-brand-600 font-semibold hover:underline">Sign in with Email</Link>
          {' · '}
          <Link to={ROUTES.PUBLIC_WARRANTY_CHECK} className="text-brand-600 font-semibold hover:underline">Warranty Check</Link>
        </p>
      </div>
    </CustomerPortalProvider>
  );
}

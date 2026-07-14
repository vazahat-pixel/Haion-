import { Link } from 'react-router-dom';
import { CustomerAccessForm } from '@/modules/customer-portal/CustomerAccessForm';
import { ROUTES } from '@/constants/routes';
import { CustomerPortalProvider } from '@/providers/CustomerPortalProvider';

export default function CustomerAccessPage() {
  return (
    <CustomerPortalProvider>
      <div className="customer-app mx-auto w-full max-w-md space-y-4 p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Haion Customer App</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Warranty, products & service — optimized for mobile
          </p>
        </div>
        <CustomerAccessForm />
        <p className="text-center text-xs text-[var(--color-text-tertiary)]">
          Already have login? <Link to="/auth/login" className="text-brand-600 hover:underline">Sign in</Link>
          {' · '}
          <Link to={ROUTES.PUBLIC_WARRANTY_CHECK} className="text-brand-600 hover:underline">Warranty only</Link>
        </p>
      </div>
    </CustomerPortalProvider>
  );
}

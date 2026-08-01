import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/schemas/auth.schema';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROLE_HOME_ROUTE } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import { MESSAGES } from '@/constants/messages';
import { toast } from '@/utils/toast';
import { env } from '@/config/env';
import { UserCircle } from 'lucide-react';

export default function CustomerLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: env.isDev
      ? { email: 'customer@haion.com', password: 'password' }
      : { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const user = await login(data);
      toast.success(MESSAGES.LOGIN_SUCCESS);
      const from = location.state?.from?.pathname;
      const targetHome = user?.role === 'CUSTOMER' ? '/customer/dashboard' : (ROLE_HOME_ROUTE[user?.role] || ROUTES.ADMIN_DASHBOARD);
      navigate(from || targetHome, { replace: true });
    } catch {
      toast.error(MESSAGES.LOGIN_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="erp-card p-5 shadow-xl">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md">
            <UserCircle className="h-6 w-6" />
          </div>
          <h1 className="erp-page-title">Customer App Sign In</h1>
          <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
            Enter your credentials to access products, bills &amp; referral rewards
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div className="space-y-2">
            <Label htmlFor="email" required>Email or Phone</Label>
            <Input
              id="email"
              type="text"
              placeholder="customer@haion.com"
              autoComplete="username"
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-[var(--color-danger)]">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" required>Password</Label>
              <Link
                to={ROUTES.AUTH_FORGOT_PASSWORD}
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Forgot password?
              </Link>
            </div>
            <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
            {errors.password && <p className="text-xs text-[var(--color-danger)]">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In to Customer App
          </Button>
        </form>

        <div className="mt-4 pt-3 border-t border-surface-3 text-center text-xs text-[var(--color-text-secondary)]">
          <span>Staff / Dealer Sign In? </span>
          <Link to="/auth/login" className="font-medium text-brand-600 hover:text-brand-700">
            Go to Staff Login
          </Link>
        </div>

        {env.isDev && (
          <p className="mt-3 rounded-md bg-surface-2 px-2.5 py-1.5 text-center text-[10px] text-[var(--color-text-tertiary)]">
            Vazahat Qureshi Demo: <strong>9876543210</strong> or <strong>customer@haion.com</strong> / Password: <strong>password</strong>
          </p>
        )}
      </div>
    </div>
  );
}

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

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: env.isDev
      ? { email: 'admin@haion.com', password: 'password' }
      : { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const user = await login(data);
      toast.success(MESSAGES.LOGIN_SUCCESS);
      const from = location.state?.from?.pathname;
      navigate(from || ROLE_HOME_ROUTE[user?.role] || ROUTES.ADMIN_DASHBOARD);
    } catch {
      toast.error(MESSAGES.LOGIN_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="erp-card p-5">
        <div className="mb-5 text-center">
          <h1 className="erp-page-title">Sign In</h1>
          <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
            Enter your credentials to continue
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div className="space-y-2">
            <Label htmlFor="email" required>Email</Label>
            <Input id="email" type="email" placeholder="you@company.com" autoComplete="email" {...register('email')} />
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
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-[var(--color-text-secondary)]">
          Customer?{' '}
          <Link to={ROUTES.CUSTOMER_ACCESS} className="font-medium text-brand-600 hover:text-brand-700">
            View account without login
          </Link>
        </p>

        {env.isDev && (
          <p className="mt-3 rounded-md bg-surface-2 px-2.5 py-1.5 text-center text-[10px] text-[var(--color-text-tertiary)]">
            Dev: <strong>admin@haion.com</strong> / <strong>password</strong>
            {' · '}
            <strong>customer@haion.com</strong>
          </p>
        )}
      </div>
    </div>
  );
}

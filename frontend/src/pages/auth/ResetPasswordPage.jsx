import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema } from '@/schemas/auth.schema';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/utils/toast';
import { KeyRound } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Invalid or missing reset token.');
      return;
    }
    try {
      await authService.resetPassword({ token, newPassword: data.password });
      toast.success('Password updated. You can sign in now.');
      navigate(ROUTES.AUTH_LOGIN);
    } catch {
      toast.error('Reset failed. The link may have expired.');
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="erp-card p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="erp-page-title text-lg">New Password</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Choose a strong password for your account.
          </p>
        </div>

        {!token ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-[var(--color-danger)]">This reset link is invalid or expired.</p>
            <Button asChild>
              <Link to={ROUTES.AUTH_FORGOT_PASSWORD}>Request a new link</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" required>New password</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
              {errors.password && <p className="text-xs text-[var(--color-danger)]">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" required>Confirm password</Label>
              <Input id="confirmPassword" type="password" autoComplete="new-password" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-xs text-[var(--color-danger)]">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Update password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

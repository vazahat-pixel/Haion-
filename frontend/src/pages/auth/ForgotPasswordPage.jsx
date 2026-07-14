import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema } from '@/schemas/auth.schema';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/utils/toast';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [devResetToken, setDevResetToken] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data) => {
    try {
      const response = await authService.forgotPassword(data.email);
      setDevResetToken(response?.resetToken || '');
      setSent(true);
      toast.success('If an account exists, a reset link has been sent.');
    } catch {
      toast.error('Unable to send reset link. Try again.');
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="erp-card p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="erp-page-title text-lg">Reset Password</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {sent
              ? 'Check your email for a password reset link.'
              : 'Enter your email and we will send you a reset link.'}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" required>Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" {...register('email')} />
              {errors.email && <p className="text-xs text-[var(--color-danger)]">{errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Send reset link
            </Button>
          </form>
        ) : (
          <div className="space-y-3">
            {devResetToken && (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-left text-xs text-amber-900">
                <p className="font-semibold">Dev reset token</p>
                <p className="mt-1 break-all">{devResetToken}</p>
                <Link
                  to={`${ROUTES.AUTH_RESET_PASSWORD}?token=${encodeURIComponent(devResetToken)}`}
                  className="mt-2 inline-block text-brand-700 underline"
                >
                  Open reset page
                </Link>
              </div>
            )}
            <Button className="w-full" variant="outline" asChild>
              <Link to={ROUTES.AUTH_LOGIN}>Back to sign in</Link>
            </Button>
          </div>
        )}

        <Link
          to={ROUTES.AUTH_LOGIN}
          className="mt-6 flex items-center justify-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}

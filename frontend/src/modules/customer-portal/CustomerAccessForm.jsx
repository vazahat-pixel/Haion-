import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { customerPanelService } from '@/services/customer-panel.service';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/utils/toast';
import { useCustomerPortalConfig } from '@/hooks/useCustomerPortalConfig';

const HUB_STORAGE_KEY = 'haion_customer_hub';
const CREDS_STORAGE_KEY = 'haion_customer_access';

const idSchema = z.object({
  mode: z.literal('id'),
  code: z.string().min(3, 'Enter your customer ID').transform((v) => v.toUpperCase()),
  phone: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
});

const billSchema = z.object({
  mode: z.literal('bill'),
  billNo: z.string().min(4, 'Enter bill number').transform((v) => v.toUpperCase()),
});

export function saveCustomerHubSession(hub, credentials) {
  sessionStorage.setItem(HUB_STORAGE_KEY, JSON.stringify({ hub, credentials }));
  if (credentials) {
    sessionStorage.setItem(CREDS_STORAGE_KEY, JSON.stringify(credentials));
  }
}

export function loadCustomerHubSession() {
  try {
    const raw = sessionStorage.getItem(HUB_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.hub ? parsed : { hub: parsed, credentials: loadCustomerAccessCredentials() };
  } catch {
    return null;
  }
}

export function loadCustomerAccessCredentials() {
  try {
    const raw = sessionStorage.getItem(CREDS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function CustomerAccessForm({ onSuccess, compact = false }) {
  const navigate = useNavigate();
  const portal = useCustomerPortalConfig();
  const [mode, setMode] = useState('id');
  const [loading, setLoading] = useState(false);

  const idForm = useForm({
    resolver: zodResolver(idSchema),
    defaultValues: { mode: 'id', code: '', phone: '' },
  });

  const billForm = useForm({
    resolver: zodResolver(billSchema),
    defaultValues: { mode: 'bill', billNo: '' },
  });

  const submit = async (payload) => {
    setLoading(true);
    try {
      const hub = await customerPanelService.access(payload);
      const credentials = payload.billNo
        ? { billNo: payload.billNo }
        : { code: payload.code, phone: payload.phone };
      saveCustomerHubSession(hub, credentials);
      if (onSuccess) onSuccess(hub);
      else navigate(ROUTES.CUSTOMER_ACCESS_HUB);
      toast.success(`Welcome, ${hub.profile?.name}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not find your account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={compact ? 'customer-card border-0 shadow-none' : 'customer-card w-full max-w-md shadow-lg'}>
      {!compact && (
        <CardHeader className="text-center">
          <div
            className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full text-white"
            style={{ background: portal.primaryColor || '#c4714f' }}
          >
            <UserCircle className="h-7 w-7" />
          </div>
          <CardTitle className="text-lg">{portal.appName || 'My Haion Account'}</CardTitle>
          <p className="text-sm text-[var(--color-text-secondary)]">{portal.tagline || 'Enter your customer ID or bill number'}</p>
        </CardHeader>
      )}
      <CardContent className={compact ? 'p-0' : undefined}>
        <div className="mb-4 flex rounded-lg border border-surface-3 p-0.5">
          <button
            type="button"
            className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${mode === 'id' ? 'text-white' : 'text-[var(--color-text-secondary)]'}`}
            style={mode === 'id' ? { background: portal.primaryColor || '#c4714f' } : undefined}
            onClick={() => setMode('id')}
          >
            Customer ID
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${mode === 'bill' ? 'text-white' : 'text-[var(--color-text-secondary)]'}`}
            style={mode === 'bill' ? { background: portal.primaryColor || '#c4714f' } : undefined}
            onClick={() => setMode('bill')}
          >
            Bill Number
          </button>
        </div>

        {mode === 'id' ? (
          <form onSubmit={idForm.handleSubmit((d) => submit(d))} className="space-y-4">
            <div>
              <Label htmlFor="code">Customer ID</Label>
              <Input id="code" placeholder="e.g. CUS-1042" {...idForm.register('code')} />
              {idForm.formState.errors.code && (
                <p className="mt-1 text-xs text-red-600">{idForm.formState.errors.code.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Registered Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="10-digit mobile"
                maxLength={10}
                {...idForm.register('phone', {
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  },
                })}
              />
              {idForm.formState.errors.phone && (
                <p className="mt-1 text-xs text-red-600">{idForm.formState.errors.phone.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              <FileText className="h-4 w-4" />
              {loading ? 'Loading…' : 'View My Account'}
            </Button>
          </form>
        ) : (
          <form onSubmit={billForm.handleSubmit((d) => submit(d))} className="space-y-4">
            <div>
              <Label htmlFor="billNo">Bill / Invoice Number</Label>
              <Input id="billNo" placeholder="e.g. BILL-2024-0892" {...billForm.register('billNo')} />
              {billForm.formState.errors.billNo && (
                <p className="mt-1 text-xs text-red-600">{billForm.formState.errors.billNo.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              <FileText className="h-4 w-4" />
              {loading ? 'Loading…' : 'View My Account'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

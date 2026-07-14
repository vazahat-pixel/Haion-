import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { partiesService } from '@/services/parties.service';
import { categoriesService } from '@/services/categories.service';
import { gstService } from '@/services/gst.service';
import { queryKeys } from '@/services/api/queryKeys';
import { PARTY_TYPE_OPTIONS } from './columns.config';
import { toast } from '@/utils/toast';
import { gstinOptionalValidator } from '@/validators/common.validators';

const bankSchema = z.object({
  accountNumber: z.string().min(1, 'Account number required'),
  confirmAccountNumber: z.string().min(1, 'Re-enter account number'),
  ifsc: z.string().optional(),
  accountHolderName: z.string().optional(),
  bankName: z.string().optional(),
  branchName: z.string().optional(),
  upiId: z.string().optional(),
}).refine((d) => d.accountNumber === d.confirmAccountNumber, {
  message: 'Account numbers do not match',
  path: ['confirmAccountNumber'],
});

const schema = z.object({
  name: z.string().min(2, 'Party name is required'),
  type: z.enum(['SUPPLIER', 'DEALER', 'CUSTOMER', 'EMPLOYEE', 'OTHER']),
  partyCategory: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  openingBalance: z.coerce.number().optional(),
  gstin: gstinOptionalValidator,
  pan: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  creditPeriodDays: z.coerce.number().min(0).optional(),
  creditLimit: z.coerce.number().min(0).optional(),
  contactPerson: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bankAccounts: z.array(bankSchema).optional(),
  notes: z.string().optional(),
});

const emptyBank = {
  accountNumber: '',
  confirmAccountNumber: '',
  ifsc: '',
  accountHolderName: '',
  bankName: '',
  branchName: '',
  upiId: '',
};

function Section({ title, children }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

export function PartyForm({ party = null, onSuccess }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const defaultTypeParam = searchParams.get('type');
  const defaultType = ['SUPPLIER', 'DEALER', 'CUSTOMER', 'EMPLOYEE', 'OTHER'].includes(defaultTypeParam)
    ? defaultTypeParam
    : 'SUPPLIER';
  const isEdit = Boolean(party?.id);
  const [categorySearch, setCategorySearch] = useState('');
  const [gstLoading, setGstLoading] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);

  const { data: catRes } = useQuery({
    queryKey: queryKeys.categories.list({ perPage: 100 }),
    queryFn: () => categoriesService.getList({ perPage: 100 }),
  });
  const categories = (catRes?.data || []).filter((c) =>
    !categorySearch || c.name?.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: party?.name || '',
      type: party?.type || defaultType,
      partyCategory: party?.partyCategory || '',
      phone: party?.phone || '',
      email: party?.email || '',
      openingBalance: party?.openingBalance ?? 0,
      gstin: party?.gstin || '',
      pan: party?.pan || '',
      billingAddress: party?.billingAddress || party?.address || '',
      shippingAddress: party?.shippingAddress || '',
      creditPeriodDays: party?.creditPeriodDays ?? 30,
      creditLimit: party?.creditLimit ?? 0,
      contactPerson: party?.contactPerson || '',
      dateOfBirth: party?.dateOfBirth || '',
      bankAccounts: (party?.bankAccounts || []).map((b) => ({
        ...b,
        confirmAccountNumber: b.accountNumber,
      })),
      notes: party?.notes || '',
    },
  });

  const { fields: bankFields, append: appendBank, remove: removeBank } = useFieldArray({
    control: form.control,
    name: 'bankAccounts',
  });

  const fetchGstDetails = async () => {
    const gstin = form.getValues('gstin')?.trim().toUpperCase();
    if (!gstin || gstin.length < 15) {
      toast.error('Enter a valid 15-character GSTIN');
      return;
    }
    setGstLoading(true);
    try {
      const data = await gstService.validateGstin(gstin);
      if (!data.valid) {
        toast.error('Invalid GSTIN format');
        return;
      }
      form.setValue('gstin', gstin);
      if (data.pan) form.setValue('pan', data.pan);
      if (data.state) form.setValue('billingAddress', data.address || '');
      if (data.legalName && !form.getValues('name')) form.setValue('name', data.tradeName || data.legalName);
      toast.success('GSTIN details populated');
    } catch {
      toast.error('Could not fetch GSTIN details');
    } finally {
      setGstLoading(false);
    }
  };

  const submit = async (data) => {
    const payload = {
      ...data,
      bankAccounts: (data.bankAccounts || []).map(({ confirmAccountNumber, ...bank }) => bank),
    };
    try {
      if (isEdit) {
        await partiesService.update(party.id, payload);
        toast.success('Party updated');
        qc.invalidateQueries({ queryKey: queryKeys.parties.all });
        onSuccess?.(party.id);
        navigate(`/admin/parties/${party.id}`);
      } else {
        const created = await partiesService.create(payload);
        toast.success('Party created');
        qc.invalidateQueries({ queryKey: queryKeys.parties.all });
        onSuccess?.(created.id);
        navigate(`/admin/parties/${created.id}`);
      }
    } catch {
      toast.error(isEdit ? 'Failed to update party' : 'Failed to create party');
    }
  };

  const addBankFromForm = () => {
    appendBank({ ...emptyBank });
    setShowBankForm(true);
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="mx-auto max-w-4xl space-y-6 pb-10">
      <Section title="General Details">
        <div className="sm:col-span-2">
          <Label>Party Name *</Label>
          <Input {...form.register('name')} placeholder="Enter name" />
          {form.formState.errors.name && <p className="text-xs text-[var(--color-danger)]">{form.formState.errors.name.message}</p>}
        </div>
        <div>
          <Label>Mobile Number</Label>
          <Input {...form.register('phone')} placeholder="Enter mobile number" />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" {...form.register('email')} placeholder="Enter email" />
        </div>
        <div>
          <Label>Opening Balance</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-tertiary)]">₹</span>
            <Input type="number" step="0.01" className="pl-8" {...form.register('openingBalance')} />
          </div>
        </div>
        <div>
          <Label>GSTIN</Label>
          <div className="flex gap-2">
            <Input
              {...form.register('gstin')}
              placeholder="ex: 29AABCU9603R1ZM"
              className="uppercase font-mono tracking-wider"
              maxLength={15}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
                form.setValue('gstin', e.target.value, { shouldValidate: true });
              }}
            />
            <Button type="button" variant="outline" onClick={fetchGstDetails} disabled={gstLoading}>
              {gstLoading ? '…' : 'Get Details'}
            </Button>
          </div>
          {form.formState.errors.gstin && <p className="mt-1 text-xs text-[var(--color-danger)]">{form.formState.errors.gstin.message}</p>}
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Note: You can auto populate party details from GSTIN</p>
        </div>
        <div>
          <Label>PAN Number</Label>
          <Input {...form.register('pan')} placeholder="Enter party PAN Number" className="uppercase" />
        </div>
        <div>
          <Label>Party Type *</Label>
          <Select {...form.register('type')}>
            {PARTY_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
        <div>
          <Label>Party Category</Label>
          <div className="relative mb-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <Input className="pl-9" placeholder="Search categories" value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} />
          </div>
          <Select {...form.register('partyCategory')}>
            <option value="">Select category…</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </Select>
        </div>
      </Section>

      <Section title="Address">
        <div className="sm:col-span-2">
          <Label>Billing Address</Label>
          <Textarea {...form.register('billingAddress')} placeholder="Enter billing address" rows={3} />
        </div>
        <div className="sm:col-span-2">
          <Label>Shipping Address</Label>
          <Textarea {...form.register('shippingAddress')} placeholder="Enter shipping address" rows={3} />
        </div>
        <div>
          <Label>Credit Period</Label>
          <div className="flex items-center gap-2">
            <Input type="number" min="0" {...form.register('creditPeriodDays')} />
            <span className="text-sm text-[var(--color-text-secondary)]">Days</span>
          </div>
        </div>
        <div>
          <Label>Credit Limit</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-tertiary)]">₹</span>
            <Input type="number" step="0.01" className="pl-8" {...form.register('creditLimit')} />
          </div>
        </div>
      </Section>

      <Section title="Contact Person Details">
        <div>
          <Label>Contact Person Name</Label>
          <Input {...form.register('contactPerson')} placeholder="Ex: Ankit Mishra" />
        </div>
        <div>
          <Label>Date of Birth</Label>
          <Input type="date" {...form.register('dateOfBirth')} />
        </div>
      </Section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Party Bank Account</CardTitle>
            <p className="text-sm text-[var(--color-text-secondary)]">Add party bank information to manage transactions</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addBankFromForm}>
            <Plus className="h-4 w-4" /> Add Bank Account
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {bankFields.length === 0 && !showBankForm && (
            <p className="text-sm text-[var(--color-text-tertiary)]">No bank accounts added yet.</p>
          )}
          {bankFields.map((field, i) => (
            <div key={field.id} className="rounded-lg border border-surface-3 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">Bank Account {i + 1}</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeBank(i)}>
                  <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Bank Account Number *</Label>
                  <Input {...form.register(`bankAccounts.${i}.accountNumber`)} placeholder="ex: 123456789" />
                </div>
                <div>
                  <Label>Re-Enter Bank Account Number *</Label>
                  <Input {...form.register(`bankAccounts.${i}.confirmAccountNumber`)} placeholder="ex: 123456789" />
                </div>
                <div>
                  <Label>IFSC Code</Label>
                  <Input {...form.register(`bankAccounts.${i}.ifsc`)} placeholder="ex: ICIC0001234" className="uppercase" />
                </div>
                <div>
                  <Label>Account Holder&apos;s Name</Label>
                  <Input {...form.register(`bankAccounts.${i}.accountHolderName`)} placeholder="ex: Babu Lal" />
                </div>
                <div>
                  <Label>Bank Name</Label>
                  <Input {...form.register(`bankAccounts.${i}.bankName`)} placeholder="ex: ICICI Bank" />
                </div>
                <div>
                  <Label>Branch Name</Label>
                  <Input {...form.register(`bankAccounts.${i}.branchName`)} placeholder="ex: Mumbai" />
                </div>
                <div className="sm:col-span-2">
                  <Label>UPI ID</Label>
                  <Input {...form.register(`bankAccounts.${i}.upiId`)} placeholder="ex: babulal@upi" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate('/admin/parties')}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : 'Submit'}
        </Button>
      </div>
    </form>
  );
}

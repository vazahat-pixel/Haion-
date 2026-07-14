import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Shield, Search, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { warrantyService } from '@/services/warranty.service';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/utils/format';
import { toast } from '@/utils/toast';

export default function PublicWarrantyCheckPage() {
  const [params] = useSearchParams();
  const [billNo, setBillNo] = useState(params.get('bill') || '');
  const [serial, setSerial] = useState(params.get('serial') || '');
  const [result, setResult] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const bill = params.get('bill');
    if (bill) {
      setBillNo(bill);
      lookup(bill, '');
    }
  }, [params]);

  const lookup = async (bill, ser) => {
    if (!bill.trim() && !ser.trim()) {
      toast.error('Enter a bill number or serial number');
      return;
    }
    setSearching(true);
    try {
      const data = await warrantyService.publicLookup({ billNo: bill.trim(), serial: ser.trim() });
      setResult(data);
    } catch {
      toast.error('Lookup failed');
      setResult(null);
    } finally {
      setSearching(false);
    }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}${ROUTES.PUBLIC_WARRANTY_CHECK}?bill=${encodeURIComponent(billNo)}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied');
  };

  return (
    <div className="w-full max-w-lg space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-brand-600" />
            Warranty Check
          </CardTitle>
          <p className="text-sm text-[var(--color-text-secondary)]">Verify coverage using your bill or serial number</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Bill / Invoice Number</Label>
            <Input value={billNo} onChange={(e) => setBillNo(e.target.value.toUpperCase())} placeholder="BILL-2024-0001" />
          </div>
          <div>
            <Label>Serial Number (optional)</Label>
            <Input value={serial} onChange={(e) => setSerial(e.target.value.toUpperCase())} placeholder="SN-MOT-12345" />
          </div>
          <Button className="w-full" disabled={searching} onClick={() => lookup(billNo, serial)}>
            <Search className="h-4 w-4" /> {searching ? 'Checking…' : 'Check Warranty'}
          </Button>
          {billNo && (
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={copyShareLink}>
              <Copy className="h-3.5 w-3.5" /> Copy shareable link
            </Button>
          )}
          <p className="text-center text-xs text-[var(--color-text-tertiary)]">
            <Link to={ROUTES.PUBLIC_COMPLAINT} className="text-brand-600 hover:underline">Raise a support complaint</Link>
          </p>
        </CardContent>
      </Card>

      {result?.found && result.warranties?.length > 0 && (
        <Card>
          <CardContent className="space-y-4 p-5">
            {result.warranties.map((w) => (
              <div key={w.id} className="space-y-2 border-b border-surface-3 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-semibold">{w.serialNo}</span>
                  <StatusBadge status={w.status} size="sm" />
                </div>
                <p className="text-sm"><span className="text-[var(--color-text-tertiary)]">Product:</span> {w.product}</p>
                <p className="text-sm"><span className="text-[var(--color-text-tertiary)]">Bill:</span> {w.billNo}</p>
                <p className="text-sm">
                  <span className="text-[var(--color-text-tertiary)]">Coverage:</span>{' '}
                  {formatDate(w.startDate)} — {formatDate(w.endDate)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {result && !result.found && (
        <Card>
          <CardContent className="p-5 text-center text-sm text-[var(--color-text-secondary)]">
            No warranty records found. Verify your bill or serial number.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

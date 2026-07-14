import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Shield } from 'lucide-react';
import { warrantyService } from '@/services/warranty.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { formatDate } from '@/utils/format';
import { toast } from '@/utils/toast';

export function WarrantyLookup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('bill') ? 'bill' : 'serial');
  const [serial, setSerial] = useState(params.get('serial') || '');
  const [billNo, setBillNo] = useState(params.get('bill') || '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = async ({ serial: s, bill: b }) => {
    setSearching(true);
    setSearched(true);
    try {
      const data = await warrantyService.publicLookup({
        serial: s?.trim() || undefined,
        billNo: b?.trim() || undefined,
      });
      const rows = Array.isArray(data) ? data : data ? [data] : [];
      setResults(rows);
      if (!rows.length) toast.error('No warranty found');
    } catch {
      setResults([]);
      toast.error('Lookup failed');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const bill = params.get('bill');
    const ser = params.get('serial');
    if (bill || ser) {
      runSearch({ serial: ser, bill });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (mode === 'serial') {
      if (!serial.trim()) {
        toast.error('Enter a serial number');
        return;
      }
      await runSearch({ serial });
    } else {
      if (!billNo.trim()) {
        toast.error('Enter a bill number');
        return;
      }
      await runSearch({ bill: billNo });
    }
  };

  return (
    <div className="space-y-5">
      <Card className="customer-card border-brand-100 bg-gradient-to-br from-brand-50/80 to-surface-1">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2 text-brand-700">
            <Shield className="h-5 w-5" />
            <p className="text-sm font-medium">Check warranty by serial number or bill</p>
          </div>
          <div className="mb-3 flex rounded-lg border border-surface-3 p-0.5">
            <button
              type="button"
              className={`flex-1 rounded-md py-1.5 text-xs font-medium ${mode === 'serial' ? 'bg-brand-600 text-white' : 'text-[var(--color-text-secondary)]'}`}
              onClick={() => setMode('serial')}
            >
              Serial
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md py-1.5 text-xs font-medium ${mode === 'bill' ? 'bg-brand-600 text-white' : 'text-[var(--color-text-secondary)]'}`}
              onClick={() => setMode('bill')}
            >
              Bill Number
            </button>
          </div>
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
            {mode === 'serial' ? (
              <Input
                value={serial}
                onChange={(e) => setSerial(e.target.value.toUpperCase())}
                placeholder="e.g. SN-MOT-45821"
                className="flex-1"
                autoComplete="off"
              />
            ) : (
              <Input
                value={billNo}
                onChange={(e) => setBillNo(e.target.value.toUpperCase())}
                placeholder="e.g. BILL-2024-0892"
                className="flex-1"
                autoComplete="off"
              />
            )}
            <Button type="submit" disabled={searching} className="shrink-0">
              <Search className="h-4 w-4" /> {searching ? 'Searching…' : 'Lookup'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {searching && <LoadingState message="Searching warranty records…" />}

      {!searching && searched && results.length === 0 && (
        <EmptyState
          icon={Shield}
          title="No warranty found"
          description="Verify your serial or bill number and try again."
        />
      )}

      {results.map((result) => (
        <Card key={result.id || result.serialNo} className="customer-card">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">Serial Number</p>
                <p className="mt-0.5 font-mono text-sm font-semibold">{result.serialNo}</p>
              </div>
              <StatusBadge status={result.status} />
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)]">Product</p>
                <p className="font-medium">{result.product}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)]">Bill</p>
                <p className="font-medium">{result.billNo || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)]">Valid From</p>
                <p>{formatDate(result.startDate)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)]">Valid Until</p>
                <p>{formatDate(result.endDate)}</p>
              </div>
            </div>
            {result.id && (
              <Button size="sm" className="w-full sm:w-auto" onClick={() => navigate(`/customer/warranty/${result.id}`)}>
                View Full Details
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

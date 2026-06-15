import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [serial, setSerial] = useState('');
  const [result, setResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = serial.trim();
    if (!q) {
      toast.error('Enter a serial number');
      return;
    }
    setSearching(true);
    setSearched(true);
    try {
      const data = await warrantyService.lookupBySerial(q);
      setResult(data);
      if (!data) toast.error('No warranty found for this serial number');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50/80 to-surface-1">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2 text-brand-700">
            <Shield className="h-5 w-5" />
            <p className="text-sm font-medium">Check warranty status by product serial number</p>
          </div>
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="e.g. SN-MOT-45821"
              className="flex-1"
              autoComplete="off"
            />
            <Button type="submit" disabled={searching} className="shrink-0">
              <Search className="h-4 w-4" /> {searching ? 'Searching…' : 'Lookup'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {searching && <LoadingState message="Searching warranty records…" />}

      {!searching && searched && !result && (
        <EmptyState
          icon={Shield}
          title="No warranty found"
          description="Verify the serial number on your product label and try again."
        />
      )}

      {result && !searching && (
        <Card>
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
                <p className="text-xs text-[var(--color-text-tertiary)]">Customer</p>
                <p className="font-medium">{result.customer}</p>
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
            <Button size="sm" className="w-full sm:w-auto" onClick={() => navigate(`/customer/warranty/${result.id}`)}>
              View Full Details
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

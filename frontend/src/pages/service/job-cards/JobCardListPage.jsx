import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollText, Search, Filter, Wrench, ShieldCheck, ShieldX } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { jobCardService } from '@/services/jobCard.service';
import { toast } from '@/utils/toast';

export default function JobCardListPage() {
  const navigate = useNavigate();
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const fetchJobCards = async () => {
    setLoading(true);
    try {
      const res = await jobCardService.getList({
        search,
        status: statusFilter,
        source: sourceFilter,
      });
      setJobCards(res.data || []);
    } catch {
      toast.error('Failed to load Job Cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobCards();
  }, [search, statusFilter, sourceFilter]);

  return (
    <PageShell title="Job Cards" subtitle="Manage repair job cards, parts consumption, and technician assignments">
      <div className="space-y-4">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 bg-surface-1 p-4 rounded-xl border border-surface-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-surface-400" />
            <Input
              placeholder="Search Job Card #, Customer, Product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            className="px-3 py-2 border rounded-md text-sm bg-surface-1"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_PARTS">Waiting Parts</option>
            <option value="REPAIRED">Repaired</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select
            className="px-3 py-2 border rounded-md text-sm bg-surface-1"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="">All Channels</option>
            <option value="CUSTOMER_PANEL">Customer Panel</option>
            <option value="TOLL_FREE">Toll-Free Support</option>
            <option value="WALK_IN">Walk-in Service Centre</option>
          </select>
        </div>

        {/* Job Cards List */}
        {loading ? (
          <div className="text-center py-12 text-surface-500">Loading Job Cards...</div>
        ) : jobCards.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl p-8 bg-surface-1">
            <ScrollText className="h-10 w-10 text-surface-400 mx-auto mb-2" />
            <p className="font-semibold text-surface-700">No Job Cards found</p>
            <p className="text-sm text-surface-500">Job Cards are automatically generated when complaints are raised.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobCards.map((card) => {
              const cardId = card.id || card._id;
              return (
                <div
                  key={cardId}
                  onClick={() => navigate(`/service/job-cards/${cardId}`)}
                  className="bg-surface-1 border border-surface-3 hover:border-primary/50 rounded-xl p-5 cursor-pointer transition-all hover:shadow-md space-y-3"
                >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-primary">{card.jobCardNo}</span>
                  <Badge variant={card.warrantyStatus?.costType === 'FOC' ? 'success' : 'secondary'}>
                    {card.warrantyStatus?.costType || 'FOC'}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold text-surface-900 line-clamp-1">{card.product?.name}</h4>
                  <p className="text-xs text-surface-500">S/N: {card.product?.serialNo || 'N/A'}</p>
                </div>

                <div className="text-xs space-y-1 text-surface-600 bg-surface-2 p-2.5 rounded-lg">
                  <p><span className="font-medium text-surface-800">Customer:</span> {card.customer?.name}</p>
                  <p><span className="font-medium text-surface-800">Phone:</span> {card.customer?.phone || 'N/A'}</p>
                  <p><span className="font-medium text-surface-800">Source:</span> {card.source?.replace(/_/g, ' ')}</p>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs border-t border-surface-2">
                  <span className="text-surface-500">
                    Parts used: {card.partsUsed?.length || 0}
                  </span>
                  <Badge variant="outline">{card.status}</Badge>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </PageShell>
  );
}

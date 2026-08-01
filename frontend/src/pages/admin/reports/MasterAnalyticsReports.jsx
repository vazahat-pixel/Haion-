import { useEffect, useState, useMemo } from 'react';
import {
  Building2,
  Package,
  Users,
  TrendingUp,
  Headphones,
  Search,
  FileSpreadsheet,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  ShieldCheck,
  Building,
  UserCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { dealersService } from '@/services/dealers.service';
import { inventoryService } from '@/services/inventory.service';
import { complaintsService } from '@/services/complaints.service';
import { customersService } from '@/services/customers.service';
import { partiesService } from '@/services/parties.service';
import { serviceCenterService } from '@/services/serviceCenter.service';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';

export function MasterAnalyticsReports() {
  const [activeTab, setActiveTab] = useState('dealers');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDealerId, setSelectedDealerId] = useState('ALL');

  // Master Data States
  const [dealers, setDealers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [serviceCenters, setServiceCenters] = useState([]);

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const [dRes, iRes, cRes, custRes, pRes, scRes] = await Promise.allSettled([
        dealersService.getList({ perPage: 200 }),
        inventoryService.getList({ perPage: 200 }),
        complaintsService.getList({ perPage: 200 }),
        customersService.getList({ perPage: 200 }),
        partiesService.getList({ perPage: 200 }),
        serviceCenterService.getList({ perPage: 200 }),
      ]);

      if (dRes.status === 'fulfilled') setDealers(dRes.value?.data || []);
      if (iRes.status === 'fulfilled') setInventory(iRes.value?.data || []);
      if (cRes.status === 'fulfilled') setComplaints(cRes.value?.data || []);

      // Combine customers from Customer collection + Party (type: CUSTOMER)
      let customerList = [];
      if (custRes.status === 'fulfilled' && custRes.value?.data?.length) {
        customerList = custRes.value.data;
      } else if (pRes.status === 'fulfilled' && pRes.value?.data?.length) {
        customerList = pRes.value.data.filter((p) => p.type === 'CUSTOMER' || !p.type);
      }
      setCustomers(customerList);

      if (scRes.status === 'fulfilled') setServiceCenters(scRes.value?.data || []);
    } catch {
      toast.error('Failed to load master analytics reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Filtered Dealers Data
  const filteredDealers = useMemo(() => {
    return dealers.filter((d) => {
      const id = d.id || d._id;
      const matchesSearch =
        d.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.code?.toLowerCase().includes(search.toLowerCase()) ||
        d.city?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = selectedDealerId === 'ALL' || id === selectedDealerId;
      return matchesSearch && matchesFilter;
    });
  }, [dealers, search, selectedDealerId]);

  // Filtered Inventory Data
  const filteredInventory = useMemo(() => {
    return inventory.filter(
      (item) =>
        item.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.sku?.toLowerCase().includes(search.toLowerCase()) ||
        item.category?.toLowerCase().includes(search.toLowerCase())
    );
  }, [inventory, search]);

  // Filtered Customers Data
  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.code?.toLowerCase().includes(search.toLowerCase()) ||
        c.city?.toLowerCase().includes(search.toLowerCase())
    );
  }, [customers, search]);

  // Summary Metrics
  const totalRetailRevenue = useMemo(() => {
    return dealers.reduce((acc, d) => acc + (d.totalSales || d.creditLimit || 0), 0);
  }, [dealers]);

  const totalOutstanding = useMemo(() => {
    return dealers.reduce((acc, d) => acc + (d.outstandingBalance || d.outstanding || 0), 0);
  }, [dealers]);

  const exportCSV = (filename, dataRows, headers) => {
    if (!dataRows.length) return toast.error('No data to export');
    let csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n';
    dataRows.forEach((row) => {
      csvContent += row.map((field) => `"${String(field || '').replace(/"/g, '""')}"`).join(',') + '\n';
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filename}.csv`);
  };

  return (
    <div className="space-y-6 transition-all duration-300">
      {/* Top Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface-1 border-surface-3 shadow-xs hover:border-brand-500/30 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-surface-500 font-medium uppercase tracking-wider">Dealer Network</p>
              <h3 className="text-2xl font-bold text-surface-900 mt-1">{dealers.length} Shops</h3>
              <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {dealers.filter((d) => d.status === 'ACTIVE').length} Active Outlets
              </p>
            </div>
            <div className="p-3 bg-brand-50 rounded-xl text-brand-600">
              <Building2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-1 border-surface-3 shadow-xs hover:border-emerald-500/30 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-surface-500 font-medium uppercase tracking-wider">Network Turnover</p>
              <h3 className="text-2xl font-bold text-surface-900 mt-1">{formatCurrency(totalRetailRevenue)}</h3>
              <p className="text-xs text-amber-600 font-semibold mt-1">
                Outstanding: {formatCurrency(totalOutstanding)}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-1 border-surface-3 shadow-xs hover:border-blue-500/30 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-surface-500 font-medium uppercase tracking-wider">Customer Directory</p>
              <h3 className="text-2xl font-bold text-surface-900 mt-1">{customers.length} Customers</h3>
              <p className="text-xs text-blue-600 font-semibold mt-1 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5" /> Registered Network
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-1 border-surface-3 shadow-xs hover:border-purple-500/30 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-surface-500 font-medium uppercase tracking-wider">Stock Catalog</p>
              <h3 className="text-2xl font-bold text-surface-900 mt-1">{inventory.length} SKUs</h3>
              <p className="text-xs text-indigo-600 font-semibold mt-1">
                {serviceCenters.length} Service Centres
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
              <Package className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-3 pb-3">
        <div className="flex flex-wrap gap-1.5 bg-surface-2 p-1 rounded-xl border border-surface-3">
          {[
            { id: 'dealers', label: 'Dealer Sales & Outlets', icon: Building2 },
            { id: 'inventory', label: 'Stock & Inventory', icon: Package },
            { id: 'customers', label: 'Customer Directory', icon: Users },
            { id: 'complaints', label: 'Service & Complaints', icon: Headphones },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  active
                    ? 'bg-surface-1 text-primary shadow-xs border border-surface-3'
                    : 'text-surface-600 hover:text-surface-900 hover:bg-surface-1/50'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-primary' : 'text-surface-400'}`} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-surface-400" />
            <Input
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs w-[220px]"
            />
          </div>
          <Button size="xs" variant="outline" onClick={fetchMasterData} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* TAB 1: DEALER SALES & OUTLETS */}
      {activeTab === 'dealers' && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-1 p-3.5 rounded-xl border border-surface-3">
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="h-4 w-4 text-surface-400" />
              <span className="text-xs font-semibold text-surface-700">Filter Outlet:</span>
              <select
                className="px-3 py-1.5 border rounded-lg text-xs bg-surface-1"
                value={selectedDealerId}
                onChange={(e) => setSelectedDealerId(e.target.value)}
              >
                <option value="ALL">All Outlets ({dealers.length})</option>
                {dealers.map((d) => (
                  <option key={d.id || d._id} value={d.id || d._id}>
                    {d.name} ({d.city})
                  </option>
                ))}
              </select>
            </div>

            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                exportCSV(
                  'Dealer_Wise_Sales_Report',
                  filteredDealers.map((d) => [
                    d.code,
                    d.name,
                    d.city,
                    d.state,
                    d.gstin || 'N/A',
                    d.outstandingBalance || d.outstanding || 0,
                    d.status,
                  ]),
                  ['Code', 'Dealer Shop Name', 'City', 'State', 'GSTIN', 'Outstanding Balance', 'Status']
                )
              }
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> Export CSV
            </Button>
          </div>

          <div className="bg-surface-1 border border-surface-3 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 border-b border-surface-3 text-surface-700 uppercase font-semibold">
                <tr>
                  <th className="p-3">Dealer Code</th>
                  <th className="p-3">Shop / Business Name</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Contact Person</th>
                  <th className="p-3 text-right">Credit Limit</th>
                  <th className="p-3 text-right">Outstanding</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-2">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-surface-500">Loading dealer outlets data...</td>
                  </tr>
                ) : filteredDealers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-surface-500">No dealer shops match the criteria.</td>
                  </tr>
                ) : (
                  filteredDealers.map((d) => (
                    <tr key={d.id || d._id} className="hover:bg-surface-2/40 transition">
                      <td className="p-3 font-mono font-bold text-primary">{d.code}</td>
                      <td className="p-3">
                        <p className="font-semibold text-surface-900">{d.name}</p>
                        <p className="text-[11px] text-surface-500 font-mono">GSTIN: {d.gstin || 'N/A'}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-surface-800">{d.city}, {d.state}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-surface-800">{d.contactName || d.name}</p>
                        <p className="text-[11px] text-surface-500">{d.contactPhone || d.phone || 'N/A'}</p>
                      </td>
                      <td className="p-3 text-right font-medium text-surface-800">
                        {formatCurrency(d.creditLimit || 0)}
                      </td>
                      <td className="p-3 text-right font-bold text-amber-600">
                        {formatCurrency(d.outstandingBalance || d.outstanding || 0)}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={d.status === 'ACTIVE' ? 'success' : 'secondary'}>{d.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: STOCK & INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between bg-surface-1 p-3.5 rounded-xl border border-surface-3">
            <span className="text-xs font-semibold text-surface-700">Live Inventory & Stock Breakdown</span>
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                exportCSV(
                  'Stock_Wise_Inventory_Report',
                  filteredInventory.map((i) => [
                    i.sku,
                    i.name,
                    i.category || 'General',
                    i.stockOnHand || i.availableQuantity || 0,
                    i.reorderThreshold || 5,
                    i.unitPrice || 0,
                  ]),
                  ['SKU', 'Product Name', 'Category', 'Available Stock', 'Reorder Threshold', 'Unit Price']
                )
              }
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> Export CSV
            </Button>
          </div>

          <div className="bg-surface-1 border border-surface-3 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 border-b border-surface-3 text-surface-700 uppercase font-semibold">
                <tr>
                  <th className="p-3">SKU Code</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Available Stock</th>
                  <th className="p-3 text-right">Reorder Threshold</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-2">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-surface-500">Loading inventory data...</td>
                  </tr>
                ) : filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-surface-500">No stock records found matching your query.</td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => {
                    const stock = item.stockOnHand ?? item.availableQuantity ?? 0;
                    const reorder = item.reorderThreshold ?? 5;
                    return (
                      <tr key={item.id || item._id} className="hover:bg-surface-2/40 transition">
                        <td className="p-3 font-mono font-bold text-primary">{item.sku}</td>
                        <td className="p-3 font-semibold text-surface-900">{item.name}</td>
                        <td className="p-3 text-surface-600">{item.category || 'General'}</td>
                        <td className="p-3 text-right font-bold text-surface-900">{stock}</td>
                        <td className="p-3 text-right text-surface-500">{reorder}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(item.unitPrice || 0)}</td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={stock <= 0 ? 'danger' : stock <= reorder ? 'warning' : 'success'}
                          >
                            {stock <= 0 ? 'OUT OF STOCK' : stock <= reorder ? 'LOW STOCK' : 'IN STOCK'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER DIRECTORY */}
      {activeTab === 'customers' && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between bg-surface-1 p-3.5 rounded-xl border border-surface-3">
            <span className="text-xs font-semibold text-surface-700">
              Registered Customers Directory ({filteredCustomers.length})
            </span>
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                exportCSV(
                  'Customer_Directory_Report',
                  filteredCustomers.map((c) => [c.code || 'CUST', c.name, c.phone || 'N/A', c.email || 'N/A', c.city || 'N/A', c.gstin || 'N/A']),
                  ['Customer Code', 'Customer Name', 'Phone', 'Email', 'City', 'GSTIN']
                )
              }
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> Export CSV
            </Button>
          </div>

          <div className="bg-surface-1 border border-surface-3 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 border-b border-surface-3 text-surface-700 uppercase font-semibold">
                <tr>
                  <th className="p-3">Customer ID</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Mobile Phone</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">City / Location</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-2">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-surface-500">Loading customer directory...</td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-surface-500">No registered customer records found in database.</td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id || c._id} className="hover:bg-surface-2/40 transition">
                      <td className="p-3 font-mono font-bold text-primary">{c.code || 'CUS-REG'}</td>
                      <td className="p-3 font-semibold text-surface-900">{c.name}</td>
                      <td className="p-3 font-medium text-surface-800">{c.phone || 'N/A'}</td>
                      <td className="p-3 text-surface-600">{c.email || 'N/A'}</td>
                      <td className="p-3 text-surface-700">{c.city || 'N/A'}{c.state ? `, ${c.state}` : ''}</td>
                      <td className="p-3">
                        <Badge variant={c.status === 'INACTIVE' ? 'secondary' : 'success'}>
                          {c.status || 'ACTIVE'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SERVICE & COMPLAINTS */}
      {activeTab === 'complaints' && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between bg-surface-1 p-3.5 rounded-xl border border-surface-3">
            <span className="text-xs font-semibold text-surface-700">Complaints Logged & Warranty Cost Breakdown</span>
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                exportCSV(
                  'Service_Complaints_Report',
                  complaints.map((c) => [
                    c.ticketNo,
                    c.source,
                    c.customer,
                    c.product,
                    c.serialNo,
                    c.costType || 'FOC',
                    c.serviceCenterName || 'Unassigned',
                    c.status,
                  ]),
                  ['Ticket #', 'Channel', 'Customer', 'Product', 'Serial No', 'Cost Type', 'Service Centre', 'Status']
                )
              }
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> Export CSV
            </Button>
          </div>

          <div className="bg-surface-1 border border-surface-3 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 border-b border-surface-3 text-surface-700 uppercase font-semibold">
                <tr>
                  <th className="p-3">Ticket #</th>
                  <th className="p-3">Source Channel</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Product / Serial</th>
                  <th className="p-3">Warranty Billing</th>
                  <th className="p-3">Assigned Service Centre</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-2">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-surface-500">Loading complaints...</td>
                  </tr>
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-surface-500">No complaint records found.</td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr key={c.id || c._id} className="hover:bg-surface-2/40 transition">
                      <td className="p-3 font-mono font-bold text-primary">{c.ticketNo}</td>
                      <td className="p-3">
                        <Badge variant="outline">{(c.source || 'CUSTOMER_PANEL').replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="p-3 font-semibold text-surface-900">{c.customer}</td>
                      <td className="p-3">
                        <p className="font-medium text-surface-800">{c.product}</p>
                        <p className="text-[11px] font-mono text-surface-500">S/N: {c.serialNo || 'N/A'}</p>
                      </td>
                      <td className="p-3">
                        <Badge variant={c.costType === 'FOC' || c.warrantyEligible ? 'success' : 'secondary'}>
                          {c.costType || (c.warrantyEligible ? 'FOC' : 'PAID')}
                        </Badge>
                      </td>
                      <td className="p-3 font-medium text-surface-800">
                        {c.serviceCenterName || <span className="text-amber-600 italic">Unassigned</span>}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline">{c.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

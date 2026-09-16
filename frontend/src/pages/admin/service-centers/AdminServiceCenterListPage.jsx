import { useEffect, useState } from 'react';
import {
  Wrench,
  Search,
  Plus,
  MapPin,
  Phone,
  Mail,
  Package,
  FileText,
  IndianRupee,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Layers,
  ArrowUpRight,
  Printer,
  Building2,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { serviceCenterService } from '@/services/serviceCenter.service';
import { serviceCenterBillingService } from '@/services/serviceCenterBilling.service';
import { companyLedgerService } from '@/services/companyLedger.service';
import { toast } from '@/utils/toast';

export default function AdminServiceCenterListPage() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedCenter, setSelectedCenter] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'invoices' | 'ledger'

  // Tab 1: Live Inventory state
  const [centerInventory, setCenterInventory] = useState([]);
  const [invLoading, setInvLoading] = useState(false);

  // Tab 2: Invoices state
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Tab 3: Ledger state
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Modal: Add / Edit Service Centre
  const [showCenterModal, setShowCenterModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [centerForm, setCenterForm] = useState({
    code: '',
    name: '',
    city: '',
    state: '',
    address: '',
    billingAddress: '',
    gstin: '',
    pan: '',
    contactPerson: '',
    phone: '',
    email: '',
  });
  const [savingCenter, setSavingCenter] = useState(false);

  // Modal: Create Sale / Invoice to Service Center
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleForm, setSaleForm] = useState({
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    paymentMode: 'BANK_TRANSFER',
    amountReceived: 0,
    notes: '',
    lineItems: [
      { sku: 'SP-BAT-01', name: 'Lithium Battery Pack 60V 30Ah', hsn: '8711', quantity: 2, unitPrice: 18500, discount: 0, gstRate: 18 },
      { sku: 'SP-CTRL-01', name: 'Smart Motor Controller 60V', hsn: '8711', quantity: 5, unitPrice: 3200, discount: 0, gstRate: 18 },
    ],
  });
  const [submittingSale, setSubmittingSale] = useState(false);

  // Modal: Record Payment on Invoice
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ invoiceId: '', amount: '', paymentMode: 'BANK_TRANSFER', referenceNo: '' });
  const [recordingPay, setRecordingPay] = useState(false);

  const fetchCenters = async () => {
    setLoading(true);
    try {
      const res = await serviceCenterService.getList({ search });
      const data = res.data || [];
      setCenters(data);
      if (data.length > 0 && !selectedCenter) {
        handleSelectCenter(data[0]);
      }
    } catch {
      toast.error('Failed to load Service Centres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenters();
  }, [search]);

  const handleSelectCenter = async (center) => {
    setSelectedCenter(center);
    const centerId = center?.id || center?._id;

    // Load inventory
    setInvLoading(true);
    try {
      const invRes = await serviceCenterService.getInventory(centerId);
      setCenterInventory(invRes.data || []);
    } catch {
      setCenterInventory([]);
    } finally {
      setInvLoading(false);
    }

    // Load invoices
    loadCenterInvoices(centerId);

    // Load ledger if party is linked
    loadCenterLedger(center);
  };

  const loadCenterInvoices = async (centerId) => {
    setInvoicesLoading(true);
    try {
      const res = await serviceCenterBillingService.getInvoices({ serviceCenterId: centerId });
      setInvoices(res.data || []);
    } catch {
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const loadCenterLedger = async (center) => {
    setLedgerLoading(true);
    try {
      const partyId = center?.party?._id || center?.party;
      if (partyId) {
        const res = await companyLedgerService.getList({ partyId, perPage: 50 });
        setLedgerEntries(res.data || []);
      } else {
        setLedgerEntries([]);
      }
    } catch {
      setLedgerEntries([]);
    } finally {
      setLedgerLoading(false);
    }
  };

  // Service Center Modal Handlers
  const openCreateCenterModal = () => {
    setIsEditing(false);
    setCenterForm({
      code: '',
      name: '',
      city: '',
      state: '',
      address: '',
      billingAddress: '',
      gstin: '',
      pan: '',
      contactPerson: '',
      phone: '',
      email: '',
    });
    setShowCenterModal(true);
  };

  const openEditCenterModal = () => {
    if (!selectedCenter) return;
    setIsEditing(true);
    setCenterForm({
      code: selectedCenter.code || '',
      name: selectedCenter.name || '',
      city: selectedCenter.city || '',
      state: selectedCenter.state || '',
      address: selectedCenter.address || '',
      billingAddress: selectedCenter.billingAddress || selectedCenter.address || '',
      gstin: selectedCenter.gstin || '',
      pan: selectedCenter.pan || '',
      contactPerson: selectedCenter.contactPerson || '',
      phone: selectedCenter.phone || '',
      email: selectedCenter.email || '',
    });
    setShowCenterModal(true);
  };

  const handleSaveCenter = async (e) => {
    e.preventDefault();
    if (!centerForm.name.trim() || !centerForm.city.trim() || !centerForm.state.trim()) {
      return toast.error('Enter Centre Name, City, and State');
    }
    setSavingCenter(true);
    try {
      if (isEditing) {
        const cId = selectedCenter.id || selectedCenter._id;
        const updated = await serviceCenterService.update(cId, centerForm);
        toast.success('Service Centre updated successfully!');
        setSelectedCenter(updated);
      } else {
        await serviceCenterService.create(centerForm);
        toast.success('Service Centre created successfully!');
      }
      setShowCenterModal(false);
      fetchCenters();
    } catch (err) {
      toast.error(err.message || 'Failed to save Service Centre');
    } finally {
      setSavingCenter(false);
    }
  };

  // Sale / Invoice Calculations
  const calcSaleTotals = () => {
    const isInterState =
      Boolean(selectedCenter?.state) &&
      selectedCenter.state.trim().toUpperCase() !== 'DELHI';

    let subtotal = 0;
    let taxable = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    saleForm.lineItems.forEach((it) => {
      const gross = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
      const disc = Number(it.discount) || 0;
      const net = Math.max(0, gross - disc);
      const rate = Number(it.gstRate) || 18;

      subtotal += gross;
      taxable += net;

      if (isInterState) {
        igst += (net * rate) / 100;
      } else {
        cgst += (net * (rate / 2)) / 100;
        sgst += (net * (rate / 2)) / 100;
      }
    });

    const taxTotal = Math.round((cgst + sgst + igst) * 100) / 100;
    const grandTotal = Math.round((taxable + taxTotal) * 100) / 100;
    const balance = Math.max(0, Math.round((grandTotal - (Number(saleForm.amountReceived) || 0)) * 100) / 100);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxable: Math.round(taxable * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      igst: Math.round(igst * 100) / 100,
      taxTotal,
      grandTotal,
      balance,
      isInterState,
    };
  };

  const handleAddLineItem = () => {
    setSaleForm((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { sku: '', name: '', hsn: '8711', quantity: 1, unitPrice: 0, discount: 0, gstRate: 18 },
      ],
    }));
  };

  const handleRemoveLineItem = (idx) => {
    setSaleForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== idx),
    }));
  };

  const handleLineItemChange = (idx, field, val) => {
    setSaleForm((prev) => {
      const copy = [...prev.lineItems];
      copy[idx] = { ...copy[idx], [field]: val };
      return { ...prev, lineItems: copy };
    });
  };

  const handleCreateSale = async (e) => {
    e.preventDefault();
    if (!selectedCenter) return toast.error('Please select a Service Centre');
    if (saleForm.lineItems.length === 0) return toast.error('Add at least one item to invoice');

    const centerId = selectedCenter.id || selectedCenter._id;
    setSubmittingSale(true);
    try {
      const res = await serviceCenterBillingService.createInvoice({
        serviceCenterId: centerId,
        invoiceDate: saleForm.invoiceDate,
        dueDate: saleForm.dueDate || null,
        paymentMode: saleForm.paymentMode,
        amountReceived: Number(saleForm.amountReceived) || 0,
        notes: saleForm.notes,
        lineItems: saleForm.lineItems,
      });

      toast.success(res.message || 'Tax Invoice generated successfully!');
      setShowSaleModal(false);

      // Refresh Inventory, Invoices, and Ledger
      handleSelectCenter(selectedCenter);
      setActiveTab('invoices');
    } catch (err) {
      toast.error(err.message || 'Failed to create Sale Invoice');
    } finally {
      setSubmittingSale(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payForm.amount || Number(payForm.amount) <= 0) return toast.error('Enter valid amount');
    setRecordingPay(true);
    try {
      await serviceCenterBillingService.recordPayment(payForm.invoiceId, {
        amount: Number(payForm.amount),
        paymentMode: payForm.paymentMode,
        referenceNo: payForm.referenceNo,
      });
      toast.success('Payment recorded successfully and Ledger updated!');
      setShowPayModal(false);
      loadCenterInvoices(selectedCenter?.id || selectedCenter?._id);
      loadCenterLedger(selectedCenter);
    } catch (err) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setRecordingPay(false);
    }
  };

  const saleTotals = calcSaleTotals();

  return (
    <PageShell
      title="Service Management (Service Centres & GST Billing)"
      subtitle="Manage registered Service Centres, live spare parts inventories, GST sales billing, and automatic company/party ledger synchronisation"
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={openCreateCenterModal}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Service Centre
          </Button>
          {selectedCenter && (
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
              onClick={() => setShowSaleModal(true)}
            >
              <Receipt className="h-4 w-4 mr-1.5" /> + New Sale to Centre (GST Invoice)
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="flex items-center gap-3 bg-surface-1 p-3 rounded-xl border border-surface-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-surface-400" />
            <Input
              placeholder="Search Service Centre by Code, Name, GSTIN, City, State..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Main 2-column workspace */}
        {loading ? (
          <div className="text-center py-12 text-surface-500">Loading Service Centres...</div>
        ) : centers.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl p-8 bg-surface-1">
            <Wrench className="h-10 w-10 text-surface-400 mx-auto mb-2" />
            <p className="font-semibold text-surface-700">No Service Centres found</p>
            <Button className="mt-3" size="sm" onClick={openCreateCenterModal}>
              Create First Service Centre
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column (4 cols): Service Centres List */}
            <div className="lg:col-span-4 space-y-2.5">
              <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider px-1">
                Registered Centres ({centers.length})
              </div>
              <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
                {centers.map((c) => {
                  const cId = c.id || c._id;
                  const selId = selectedCenter?.id || selectedCenter?._id;
                  const isSel = selId === cId;
                  return (
                    <div
                      key={cId}
                      onClick={() => handleSelectCenter(c)}
                      className={`p-3.5 border rounded-xl cursor-pointer transition-all duration-150 ${
                        isSel
                          ? 'border-amber-500/60 bg-amber-500/10 shadow-sm'
                          : 'border-surface-3 bg-surface-1 hover:border-surface-4 hover:bg-surface-2/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-400 text-xs">{c.code}</span>
                        <Badge variant={c.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px] py-0">
                          {c.status}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-surface-900 mt-1 text-sm">{c.name}</h4>
                      <p className="text-xs text-surface-600 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-surface-400 shrink-0" /> {c.city}, {c.state}
                      </p>
                      <div className="text-[11px] text-surface-500 mt-2 pt-2 border-t border-surface-2 flex items-center justify-between">
                        <span className="truncate max-w-[150px]">
                          {c.gstin ? `GST: ${c.gstin}` : 'Unregistered'}
                        </span>
                        <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                          Inspect →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column (8 cols): Active Service Centre Workspace */}
            <div className="lg:col-span-8 space-y-4">
              {selectedCenter ? (
                <>
                  {/* Top Profile Card */}
                  <div className="bg-surface-1 border border-surface-3 rounded-xl p-4.5 space-y-3 shadow-xs">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-surface-2 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-surface-900">{selectedCenter.name}</h3>
                          <Badge variant="outline" className="font-mono text-xs">
                            {selectedCenter.code}
                          </Badge>
                          <Badge variant={selectedCenter.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px]">
                            {selectedCenter.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-surface-500 mt-1 flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-surface-400" /> {selectedCenter.city}, {selectedCenter.state}
                          </span>
                          {selectedCenter.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 text-surface-400" /> {selectedCenter.phone}
                            </span>
                          )}
                          {selectedCenter.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5 text-surface-400" /> {selectedCenter.email}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={openEditCenterModal} className="h-8 text-xs">
                          <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit Profile & GST
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
                          onClick={() => setShowSaleModal(true)}
                        >
                          <Receipt className="h-3.5 w-3.5 mr-1" /> Create Sale
                        </Button>
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                      <div className="p-2.5 rounded-lg bg-surface-2/50 border border-surface-3/60">
                        <span className="text-surface-500 block text-[11px]">GSTIN</span>
                        <span className="font-mono font-semibold text-surface-900">
                          {selectedCenter.gstin || 'Not registered'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-surface-2/50 border border-surface-3/60">
                        <span className="text-surface-500 block text-[11px]">PAN</span>
                        <span className="font-mono font-semibold text-surface-900">
                          {selectedCenter.pan || 'N/A'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-surface-2/50 border border-surface-3/60">
                        <span className="text-surface-500 block text-[11px]">Total Invoices</span>
                        <span className="font-semibold text-surface-900">
                          {invoices.length} Bills
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-surface-2/50 border border-surface-3/60">
                        <span className="text-surface-500 block text-[11px]">Inventory Stocked</span>
                        <span className="font-semibold text-surface-900">
                          {centerInventory.reduce((acc, i) => acc + (i.availableStock || 0), 0)} Units
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Tabs */}
                  <div className="flex border-b border-surface-3 text-xs font-semibold gap-2">
                    <button
                      onClick={() => setActiveTab('inventory')}
                      className={`pb-2.5 px-3 flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                        activeTab === 'inventory'
                          ? 'border-amber-400 text-amber-400'
                          : 'border-transparent text-surface-500 hover:text-surface-900'
                      }`}
                    >
                      <Package className="h-4 w-4" /> Live Inventory ({centerInventory.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('invoices')}
                      className={`pb-2.5 px-3 flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                        activeTab === 'invoices'
                          ? 'border-amber-400 text-amber-400'
                          : 'border-transparent text-surface-500 hover:text-surface-900'
                      }`}
                    >
                      <FileText className="h-4 w-4" /> Sales & GST Invoices ({invoices.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('ledger')}
                      className={`pb-2.5 px-3 flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                        activeTab === 'ledger'
                          ? 'border-amber-400 text-amber-400'
                          : 'border-transparent text-surface-500 hover:text-surface-900'
                      }`}
                    >
                      <IndianRupee className="h-4 w-4" /> Financial Ledger ({ledgerEntries.length})
                    </button>
                  </div>

                  {/* Tab 1: Live Inventory */}
                  {activeTab === 'inventory' && (
                    <div className="bg-surface-1 border border-surface-3 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-surface-900 flex items-center gap-2">
                          <Package className="h-4 w-4 text-amber-400" /> Center Stock Status
                        </h4>
                        <span className="text-xs text-surface-500">
                          Auto-increments when you bill & dispatch spares to this centre
                        </span>
                      </div>

                      {invLoading ? (
                        <div className="py-12 text-center text-xs text-surface-500">Loading live inventory...</div>
                      ) : centerInventory.length === 0 ? (
                        <div className="py-12 text-center border border-dashed rounded-xl bg-surface-2/20">
                          <Package className="h-8 w-8 text-surface-400 mx-auto mb-2 opacity-60" />
                          <p className="text-xs text-surface-600 font-medium">No inventory stocked at this centre yet.</p>
                          <Button
                            size="sm"
                            className="mt-3 text-xs bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
                            onClick={() => setShowSaleModal(true)}
                          >
                            + Create First Sale / Stock Transfer
                          </Button>
                        </div>
                      ) : (
                        <div className="border border-surface-3 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-surface-2 text-surface-700 uppercase font-semibold">
                              <tr>
                                <th className="p-3">SKU</th>
                                <th className="p-3">Part Name</th>
                                <th className="p-3">Category</th>
                                <th className="p-3">Available</th>
                                <th className="p-3">Defective</th>
                                <th className="p-3">Unit Price</th>
                                <th className="p-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-2">
                              {centerInventory.map((item) => (
                                <tr key={item._id} className="hover:bg-surface-2/30">
                                  <td className="p-3 font-mono font-semibold text-amber-400">{item.sku}</td>
                                  <td className="p-3 font-medium text-surface-900">{item.name}</td>
                                  <td className="p-3 text-surface-500">{item.category || 'Spares'}</td>
                                  <td className="p-3 font-bold text-surface-900 text-sm">{item.availableStock}</td>
                                  <td className="p-3 font-semibold text-red-400">{item.defectiveStock || 0}</td>
                                  <td className="p-3 font-mono">₹{(item.unitPrice || 0).toLocaleString()}</td>
                                  <td className="p-3">
                                    <Badge
                                      variant={
                                        item.availableStock <= 0
                                          ? 'danger'
                                          : item.availableStock <= item.reorderLevel
                                          ? 'warning'
                                          : 'success'
                                      }
                                      className="text-[10px]"
                                    >
                                      {item.availableStock <= 0 ? 'OUT OF STOCK' : item.availableStock <= item.reorderLevel ? 'LOW STOCK' : 'IN STOCK'}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Sales & GST Invoices */}
                  {activeTab === 'invoices' && (
                    <div className="bg-surface-1 border border-surface-3 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-surface-900 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-amber-400" /> GST Tax Invoices
                          </h4>
                          <p className="text-[11px] text-surface-500">
                            B2B sales to this service center with full HSN & CGST/SGST/IGST breakdown
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="text-xs bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
                          onClick={() => setShowSaleModal(true)}
                        >
                          <Receipt className="h-3.5 w-3.5 mr-1" /> + Create Invoice
                        </Button>
                      </div>

                      {invoicesLoading ? (
                        <div className="py-12 text-center text-xs text-surface-500">Loading invoices...</div>
                      ) : invoices.length === 0 ? (
                        <div className="py-12 text-center border border-dashed rounded-xl bg-surface-2/20">
                          <FileText className="h-8 w-8 text-surface-400 mx-auto mb-2 opacity-60" />
                          <p className="text-xs text-surface-600 font-medium">No sales invoices generated yet.</p>
                          <Button
                            size="sm"
                            className="mt-3 text-xs bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
                            onClick={() => setShowSaleModal(true)}
                          >
                            + Create First Sale Invoice
                          </Button>
                        </div>
                      ) : (
                        <div className="border border-surface-3 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-surface-2 text-surface-700 uppercase font-semibold">
                              <tr>
                                <th className="p-3">Invoice #</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Taxable</th>
                                <th className="p-3">GST Total</th>
                                <th className="p-3">Grand Total</th>
                                <th className="p-3">Paid / Bal</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-2">
                              {invoices.map((inv) => (
                                <tr key={inv._id} className="hover:bg-surface-2/30">
                                  <td className="p-3 font-mono font-bold text-amber-400">{inv.invoiceNo}</td>
                                  <td className="p-3 text-surface-500">
                                    {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="p-3 font-mono">₹{(inv.taxableAmount || 0).toLocaleString()}</td>
                                  <td className="p-3 font-mono text-zinc-300">
                                    ₹{(inv.taxTotal || 0).toLocaleString()}
                                    <span className="block text-[10px] text-surface-500">
                                      {inv.igstTotal > 0 ? `IGST: ₹${inv.igstTotal}` : `CGST+SGST: ₹${inv.cgstTotal + inv.sgstTotal}`}
                                    </span>
                                  </td>
                                  <td className="p-3 font-mono font-bold text-surface-900 text-sm">
                                    ₹{(inv.grandTotal || 0).toLocaleString()}
                                  </td>
                                  <td className="p-3 font-mono text-xs">
                                    <span className="text-green-400">₹{(inv.amountReceived || 0).toLocaleString()}</span>
                                    <span className="text-surface-500"> / </span>
                                    <span className="text-red-400">₹{(inv.balanceAmount || 0).toLocaleString()}</span>
                                  </td>
                                  <td className="p-3">
                                    <Badge
                                      variant={
                                        inv.paymentStatus === 'PAID'
                                          ? 'success'
                                          : inv.paymentStatus === 'PARTIAL'
                                          ? 'warning'
                                          : 'danger'
                                      }
                                      className="text-[10px]"
                                    >
                                      {inv.paymentStatus || 'UNPAID'}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-right space-x-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2 text-xs"
                                      onClick={() => {
                                        setSelectedInvoice(inv);
                                        setShowInvoiceModal(true);
                                      }}
                                    >
                                      View Bill
                                    </Button>
                                    {inv.balanceAmount > 0 && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2 text-xs text-amber-400 border-amber-400/40"
                                        onClick={() => {
                                          setPayForm({
                                            invoiceId: inv._id,
                                            amount: inv.balanceAmount,
                                            paymentMode: 'BANK_TRANSFER',
                                            referenceNo: '',
                                          });
                                          setShowPayModal(true);
                                        }}
                                      >
                                        + Payment
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Company & Party Ledger */}
                  {activeTab === 'ledger' && (
                    <div className="bg-surface-1 border border-surface-3 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-surface-900 flex items-center gap-2">
                            <IndianRupee className="h-4 w-4 text-amber-400" /> Account Statement & Company Ledger
                          </h4>
                          <p className="text-[11px] text-surface-500">
                            Real-time entries posted to Company Ledger and mirrored in Party account
                          </p>
                        </div>
                      </div>

                      {ledgerLoading ? (
                        <div className="py-12 text-center text-xs text-surface-500">Loading ledger statement...</div>
                      ) : ledgerEntries.length === 0 ? (
                        <div className="py-12 text-center border border-dashed rounded-xl bg-surface-2/20">
                          <IndianRupee className="h-8 w-8 text-surface-400 mx-auto mb-2 opacity-60" />
                          <p className="text-xs text-surface-600 font-medium">No ledger transactions posted yet.</p>
                          <p className="text-[11px] text-surface-400 mt-1">
                            Creating sales invoices or recording payments will automatically write ledger rows.
                          </p>
                        </div>
                      ) : (
                        <div className="border border-surface-3 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-surface-2 text-surface-700 uppercase font-semibold">
                              <tr>
                                <th className="p-3">Date</th>
                                <th className="p-3">Txn Type</th>
                                <th className="p-3">Voucher / Ref</th>
                                <th className="p-3">Description</th>
                                <th className="p-3">Credit (In)</th>
                                <th className="p-3">Debit (Out)</th>
                                <th className="p-3">Balance</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-2">
                              {ledgerEntries.map((row) => (
                                <tr key={row._id} className="hover:bg-surface-2/30">
                                  <td className="p-3 text-surface-500">
                                    {new Date(row.date || row.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="p-3 font-semibold text-amber-400 text-[11px]">
                                    {row.txnType}
                                  </td>
                                  <td className="p-3 font-mono font-bold text-surface-900">
                                    {row.referenceNo || '—'}
                                  </td>
                                  <td className="p-3 text-surface-600 max-w-[220px] truncate" title={row.description}>
                                    {row.description}
                                  </td>
                                  <td className="p-3 font-mono font-semibold text-green-400">
                                    {row.credit > 0 ? `₹${row.credit.toLocaleString()}` : '—'}
                                  </td>
                                  <td className="p-3 font-mono font-semibold text-red-400">
                                    {row.debit > 0 ? `₹${row.debit.toLocaleString()}` : '—'}
                                  </td>
                                  <td className="p-3 font-mono font-bold text-surface-900">
                                    ₹{(row.balance || 0).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-24 text-center text-surface-500 bg-surface-1 border border-surface-3 rounded-xl">
                  <Wrench className="h-10 w-10 text-surface-400 mx-auto mb-2 opacity-60" />
                  <p className="font-semibold text-surface-700">Select a Service Centre</p>
                  <p className="text-xs text-surface-400 mt-1">
                    Click any service centre on the left to inspect its live stock, generate GST sales invoices, or view financial ledger.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Add / Edit Service Centre */}
        {showCenterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-surface-1 border border-surface-3 rounded-xl p-6 max-w-xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-surface-2 pb-3">
                <h3 className="text-base font-bold text-surface-900">
                  {isEditing ? 'Edit Service Centre Details & GST' : 'Add New Service Centre'}
                </h3>
                <button
                  onClick={() => setShowCenterModal(false)}
                  className="text-surface-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCenter} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Centre Code</Label>
                    <Input
                      placeholder="e.g. SC-004"
                      value={centerForm.code}
                      onChange={(e) => setCenterForm({ ...centerForm, code: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Service Centre Name *</Label>
                    <Input
                      placeholder="e.g. Metro EV Service Hub"
                      value={centerForm.name}
                      onChange={(e) => setCenterForm({ ...centerForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">GSTIN (15 Digits)</Label>
                    <Input
                      placeholder="07AAAAA0000A1Z5"
                      value={centerForm.gstin}
                      onChange={(e) => setCenterForm({ ...centerForm, gstin: e.target.value.toUpperCase() })}
                      className="font-mono uppercase"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">PAN (10 Digits)</Label>
                    <Input
                      placeholder="AAAAA0000A"
                      value={centerForm.pan}
                      onChange={(e) => setCenterForm({ ...centerForm, pan: e.target.value.toUpperCase() })}
                      className="font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">State * (Important for CGST/SGST vs IGST)</Label>
                    <Input
                      placeholder="e.g. Delhi, Maharashtra, Rajasthan"
                      value={centerForm.state}
                      onChange={(e) => setCenterForm({ ...centerForm, state: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs">City *</Label>
                    <Input
                      placeholder="City"
                      value={centerForm.city}
                      onChange={(e) => setCenterForm({ ...centerForm, city: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Contact Person</Label>
                    <Input
                      placeholder="Manager / Owner Name"
                      value={centerForm.contactPerson}
                      onChange={(e) => setCenterForm({ ...centerForm, contactPerson: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Phone Number</Label>
                    <Input
                      placeholder="9876543210"
                      value={centerForm.phone}
                      onChange={(e) => setCenterForm({ ...centerForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="service@example.com"
                    value={centerForm.email}
                    onChange={(e) => setCenterForm({ ...centerForm, email: e.target.value })}
                  />
                </div>

                <div>
                  <Label className="text-xs">Official Billing Address</Label>
                  <Input
                    placeholder="Complete Shop / Center Address for Tax Invoicing"
                    value={centerForm.billingAddress}
                    onChange={(e) => setCenterForm({ ...centerForm, billingAddress: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-surface-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowCenterModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={savingCenter}
                    className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
                  >
                    {savingCenter ? 'Saving...' : isEditing ? 'Update Centre' : 'Create Centre'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create Sale to Service Center (GST Invoice) */}
        {showSaleModal && selectedCenter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="bg-surface-1 border border-surface-3 rounded-xl p-6 max-w-4xl w-full space-y-4 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-surface-2 pb-3">
                <div>
                  <h3 className="text-base font-bold text-surface-900 flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-amber-400" />
                    New Sale & GST Invoice to {selectedCenter.name}
                  </h3>
                  <p className="text-xs text-surface-500 mt-0.5">
                    GST: {selectedCenter.gstin || 'Unregistered'} | State: {selectedCenter.state} (
                    {saleTotals.isInterState ? 'Inter-State IGST' : 'Intra-State CGST+SGST'} Applicable)
                  </p>
                </div>
                <button
                  onClick={() => setShowSaleModal(false)}
                  className="text-surface-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSale} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-2/40 p-3 rounded-lg border border-surface-3">
                  <div>
                    <Label className="text-xs">Invoice Date</Label>
                    <Input
                      type="date"
                      value={saleForm.invoiceDate}
                      onChange={(e) => setSaleForm({ ...saleForm, invoiceDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Due Date</Label>
                    <Input
                      type="date"
                      value={saleForm.dueDate}
                      onChange={(e) => setSaleForm({ ...saleForm, dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Payment Mode</Label>
                    <select
                      className="w-full h-9 rounded-md border border-surface-3 bg-surface-1 px-3 text-xs text-surface-900 focus:outline-hidden focus:ring-1 focus:ring-primary"
                      value={saleForm.paymentMode}
                      onChange={(e) => setSaleForm({ ...saleForm, paymentMode: e.target.value })}
                    >
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="CASH">Cash</option>
                      <option value="CREDIT">On Credit (30 Days)</option>
                    </select>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-surface-900 uppercase tracking-wider">
                      Spares & Items to Bill
                    </Label>
                    <Button type="button" size="sm" variant="outline" onClick={handleAddLineItem} className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Add Row
                    </Button>
                  </div>

                  <div className="border border-surface-3 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-2 text-surface-700 uppercase font-semibold">
                        <tr>
                          <th className="p-2.5">SKU</th>
                          <th className="p-2.5">Part / Item Name</th>
                          <th className="p-2.5 w-20">HSN</th>
                          <th className="p-2.5 w-16">Qty</th>
                          <th className="p-2.5 w-24">Price (₹)</th>
                          <th className="p-2.5 w-20">GST %</th>
                          <th className="p-2.5 text-right w-24">Total (₹)</th>
                          <th className="p-2.5 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-2">
                        {saleForm.lineItems.map((item, idx) => {
                          const net = Math.max(0, (item.quantity || 0) * (item.unitPrice || 0) - (item.discount || 0));
                          const tax = (net * (item.gstRate || 0)) / 100;
                          const lineTot = Math.round((net + tax) * 100) / 100;

                          return (
                            <tr key={idx} className="bg-surface-1">
                              <td className="p-2">
                                <Input
                                  placeholder="SKU"
                                  value={item.sku}
                                  onChange={(e) => handleLineItemChange(idx, 'sku', e.target.value.toUpperCase())}
                                  className="h-7 font-mono uppercase text-xs"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  placeholder="Item Description"
                                  value={item.name}
                                  onChange={(e) => handleLineItemChange(idx, 'name', e.target.value)}
                                  className="h-7 text-xs"
                                  required
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  value={item.hsn}
                                  onChange={(e) => handleLineItemChange(idx, 'hsn', e.target.value)}
                                  className="h-7 font-mono text-xs"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                                  className="h-7 text-xs"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.unitPrice}
                                  onChange={(e) => handleLineItemChange(idx, 'unitPrice', e.target.value)}
                                  className="h-7 font-mono text-xs"
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={item.gstRate}
                                  onChange={(e) => handleLineItemChange(idx, 'gstRate', Number(e.target.value))}
                                  className="h-7 w-full rounded-md border border-surface-3 bg-surface-1 px-1 text-xs text-surface-900"
                                >
                                  <option value="5">5%</option>
                                  <option value="12">12%</option>
                                  <option value="18">18%</option>
                                  <option value="28">28%</option>
                                </select>
                              </td>
                              <td className="p-2 text-right font-mono font-semibold text-surface-900">
                                ₹{lineTot.toLocaleString()}
                              </td>
                              <td className="p-2 text-center">
                                {saleForm.lineItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLineItem(idx)}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals Breakdown Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Invoice Notes & Terms</Label>
                      <Input
                        placeholder="e.g. Spares dispatched via SafeExpress courier"
                        value={saleForm.notes}
                        onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Amount Collected / Received Now (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={saleForm.amountReceived}
                        onChange={(e) => setSaleForm({ ...saleForm, amountReceived: e.target.value })}
                        className="font-mono text-xs text-green-400 font-bold"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-surface-2/50 rounded-xl border border-surface-3 space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between text-surface-500">
                      <span>Subtotal (Gross):</span>
                      <span>₹{saleTotals.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-surface-800">
                      <span>Taxable Amount:</span>
                      <span>₹{saleTotals.taxable.toLocaleString()}</span>
                    </div>
                    {!saleTotals.isInterState ? (
                      <>
                        <div className="flex justify-between text-zinc-300">
                          <span>CGST (Intra-state):</span>
                          <span>₹{saleTotals.cgst.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-zinc-300">
                          <span>SGST (Intra-state):</span>
                          <span>₹{saleTotals.sgst.toLocaleString()}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-amber-400 font-semibold">
                        <span>IGST (Inter-state):</span>
                        <span>₹{saleTotals.igst.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-surface-900 border-t border-surface-3 pt-1 text-sm">
                      <span>Grand Total (with GST):</span>
                      <span className="text-amber-400">₹{saleTotals.grandTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-surface-500 pt-0.5">
                      <span>Amount Received:</span>
                      <span className="text-green-400">
                        ₹{(Number(saleForm.amountReceived) || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-red-400 border-t border-surface-3 pt-1">
                      <span>Balance Outstanding:</span>
                      <span>₹{saleTotals.balance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-surface-2">
                  <div className="text-[11px] text-surface-500 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                    <span>Auto-updates Central Stock, Center Inventory, and Company Ledger</span>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowSaleModal(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={submittingSale}
                      className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
                    >
                      {submittingSale ? 'Generating Bill...' : 'Generate Invoice & Post Ledger'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: View Single Invoice Details */}
        {showInvoiceModal && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="bg-surface-1 border border-surface-3 rounded-xl p-6 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-surface-2 pb-3">
                <div>
                  <h3 className="text-base font-bold text-surface-900 font-mono">
                    Tax Invoice: {selectedInvoice.invoiceNo}
                  </h3>
                  <p className="text-xs text-surface-500">
                    Date: {new Date(selectedInvoice.invoiceDate).toLocaleDateString()} | Billed To: {selectedInvoice.serviceCenterName}
                  </p>
                </div>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-surface-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs space-y-3">
                <div className="grid grid-cols-2 gap-3 p-3 bg-surface-2/40 rounded-lg border border-surface-3">
                  <div>
                    <span className="text-surface-500 block text-[11px]">Billed To (Service Centre)</span>
                    <span className="font-bold text-surface-900">{selectedInvoice.serviceCenterName}</span>
                    <span className="block text-surface-500">GSTIN: {selectedInvoice.serviceCenterGstin || 'Unregistered'}</span>
                    <span className="block text-surface-500">{selectedInvoice.billingAddress || selectedInvoice.serviceCenterState}</span>
                  </div>
                  <div>
                    <span className="text-surface-500 block text-[11px]">Payment Status</span>
                    <Badge variant={selectedInvoice.paymentStatus === 'PAID' ? 'success' : 'danger'}>
                      {selectedInvoice.paymentStatus}
                    </Badge>
                    <span className="block text-surface-500 mt-1">Paid: ₹{(selectedInvoice.amountReceived || 0).toLocaleString()}</span>
                    <span className="block font-bold text-red-400">Balance: ₹{(selectedInvoice.balanceAmount || 0).toLocaleString()}</span>
                  </div>
                </div>

                <table className="w-full text-left text-xs border border-surface-3 rounded-lg overflow-hidden">
                  <thead className="bg-surface-2 uppercase font-semibold">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Rate</th>
                      <th className="p-2">GST</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-2">
                    {selectedInvoice.lineItems?.map((it, i) => (
                      <tr key={i}>
                        <td className="p-2 font-medium">
                          {it.name} <span className="text-[10px] text-surface-400 block font-mono">{it.sku}</span>
                        </td>
                        <td className="p-2 font-bold">{it.quantity}</td>
                        <td className="p-2 font-mono">₹{it.unitPrice}</td>
                        <td className="p-2 font-mono">{it.gstRate}%</td>
                        <td className="p-2 text-right font-mono font-bold">₹{it.lineTotal?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end pt-2">
                  <div className="w-64 space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-surface-500">
                      <span>Taxable Amount:</span>
                      <span>₹{(selectedInvoice.taxableAmount || 0).toLocaleString()}</span>
                    </div>
                    {selectedInvoice.cgstTotal > 0 && (
                      <div className="flex justify-between text-surface-500">
                        <span>CGST:</span>
                        <span>₹{(selectedInvoice.cgstTotal || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedInvoice.sgstTotal > 0 && (
                      <div className="flex justify-between text-surface-500">
                        <span>SGST:</span>
                        <span>₹{(selectedInvoice.sgstTotal || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedInvoice.igstTotal > 0 && (
                      <div className="flex justify-between text-surface-500">
                        <span>IGST:</span>
                        <span>₹{(selectedInvoice.igstTotal || 0).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-amber-400 border-t border-surface-3 pt-1">
                      <span>Grand Total:</span>
                      <span>₹{(selectedInvoice.grandTotal || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-surface-2">
                <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs">
                  <Printer className="h-3.5 w-3.5 mr-1" /> Print Invoice
                </Button>
                <Button size="sm" onClick={() => setShowInvoiceModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Record Payment on Invoice */}
        {showPayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-surface-1 border border-surface-3 rounded-xl p-5 max-w-sm w-full space-y-3">
              <h3 className="text-sm font-bold text-surface-900">Record Service Centre Payment</h3>
              <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
                <div>
                  <Label className="text-xs">Amount Received (₹)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={payForm.amount}
                    onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Payment Mode</Label>
                  <select
                    value={payForm.paymentMode}
                    onChange={(e) => setPayForm({ ...payForm, paymentMode: e.target.value })}
                    className="w-full h-8 rounded-md border border-surface-3 bg-surface-1 px-2 text-xs text-surface-900"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Ref / Transaction #</Label>
                  <Input
                    placeholder="e.g. UTR / UPI Ref"
                    value={payForm.referenceNo}
                    onChange={(e) => setPayForm({ ...payForm, referenceNo: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-surface-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowPayModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={recordingPay}
                    className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
                  >
                    {recordingPay ? 'Recording...' : 'Record Payment'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

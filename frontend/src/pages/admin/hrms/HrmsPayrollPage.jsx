import { useEffect, useState } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  Printer,
  CheckCircle2,
  FileText,
  DollarSign,
  Building2,
  Calendar,
  AlertCircle,
  Clock,
  IndianRupee,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { hrmsService } from '@/services/hrms.service';
import { toast } from '@/utils/toast';

export default function HrmsPayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Payslip Modal State
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);

  // Disburse Modal State
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [disburseTarget, setDisburseTarget] = useState(null);
  const [disburseForm, setDisburseForm] = useState({ paymentMode: 'BANK_TRANSFER', referenceNo: '', notes: '' });
  const [disbursing, setDisbursing] = useState(false);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const res = await hrmsService.getPayrolls({ month: selectedMonth, perPage: 100 });
      setPayrolls(res.data || []);
    } catch {
      toast.error('Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [selectedMonth]);

  const handleGeneratePayroll = async () => {
    setGenerating(true);
    try {
      const res = await hrmsService.generatePayroll({ month: selectedMonth });
      toast.success(res.message || 'Payroll generated successfully!');
      fetchPayrolls();
    } catch (err) {
      toast.error(err.message || 'Failed to generate payroll');
    } finally {
      setGenerating(false);
    }
  };

  const handleDisburse = async (e) => {
    e.preventDefault();
    if (!disburseTarget) return;

    setDisbursing(true);
    try {
      const res = await hrmsService.disbursePayroll(disburseTarget._id || disburseTarget.id, disburseForm);
      toast.success(res.message || 'Salary disbursed and posted to Company Ledger!');
      setShowDisburseModal(false);
      setDisburseTarget(null);
      fetchPayrolls();
    } catch (err) {
      toast.error(err.message || 'Failed to disburse salary');
    } finally {
      setDisbursing(false);
    }
  };

  const totalGrossCost = payrolls.reduce((acc, p) => acc + (p.grossSalary || 0), 0);
  const totalNetCost = payrolls.reduce((acc, p) => acc + (p.netSalary || 0), 0);
  const paidCount = payrolls.filter((p) => p.paymentStatus === 'PAID').length;
  const pendingCount = payrolls.filter((p) => p.paymentStatus !== 'PAID').length;

  return (
    <PageShell
      title="Payroll Processing & Payslip Engine"
      subtitle="Generate monthly compensation registers, calculate statutory deductions, and post salary expenses directly to Company Ledger"
      actions={
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
            disabled={generating}
            onClick={handleGeneratePayroll}
          >
            <CreditCard className="h-4 w-4 mr-1.5" />
            {generating ? 'Calculating...' : `Run Payroll for ${selectedMonth}`}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Month Selector and Stats */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-1 p-3.5 rounded-xl border border-surface-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-surface-500">Payroll Month:</span>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 w-40 text-xs"
            />
          </div>

          <div className="flex items-center gap-4 font-mono text-xs">
            <div>
              <span className="text-surface-500 block text-[10.5px]">Total Net Payroll</span>
              <span className="font-bold text-amber-400 text-sm">₹{totalNetCost.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-surface-500 block text-[10.5px]">Disbursed</span>
              <span className="font-bold text-green-400">{paidCount} Staff</span>
            </div>
            <div>
              <span className="text-surface-500 block text-[10.5px]">Pending Payment</span>
              <span className="font-bold text-red-400">{pendingCount} Staff</span>
            </div>
          </div>
        </div>

        {/* Payroll Register Table */}
        <div className="bg-surface-1 border border-surface-3 rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs text-surface-500">Loading payroll register...</div>
          ) : payrolls.length === 0 ? (
            <div className="py-16 text-center text-xs text-surface-500 space-y-2">
              <CreditCard className="h-10 w-10 text-surface-400 mx-auto opacity-60" />
              <p className="font-semibold text-surface-700">No payroll generated for {selectedMonth}</p>
              <p className="text-xs text-surface-400">Click "Run Payroll" above to automatically calculate working days and salaries.</p>
              <Button size="sm" className="mt-2" onClick={handleGeneratePayroll} disabled={generating}>
                Generate {selectedMonth} Payroll
              </Button>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 text-surface-700 uppercase font-semibold">
                <tr>
                  <th className="p-3">Staff Member</th>
                  <th className="p-3">Department & Role</th>
                  <th className="p-3">Present / Days</th>
                  <th className="p-3">Gross Salary</th>
                  <th className="p-3">Deductions</th>
                  <th className="p-3">Net Payable</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-2">
                {payrolls.map((p) => (
                  <tr key={p._id || p.id} className="hover:bg-surface-2/30">
                    <td className="p-3 font-semibold text-surface-900">
                      {p.employeeName}
                      <span className="block font-mono text-[10.5px] text-amber-400 font-normal">
                        {p.empId}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-surface-900 block font-medium">{p.designation || 'Staff'}</span>
                      <span className="text-[11px] text-surface-500">{p.department}</span>
                    </td>
                    <td className="p-3 font-mono">
                      {p.presentDays || p.totalDaysInMonth - 4} / {p.totalDaysInMonth} Days
                    </td>
                    <td className="p-3 font-mono font-semibold text-surface-900">
                      ₹{(p.grossSalary || 0).toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-red-400">
                      ₹{(p.totalDeductions || 0).toLocaleString()}
                      <span className="block text-[10px] text-surface-500">
                        PF: ₹{p.deductions?.pf || 0} • PT: ₹{p.deductions?.professionalTax || 0}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-400 text-sm">
                      ₹{(p.netSalary || 0).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={p.paymentStatus === 'PAID' ? 'success' : 'warning'}
                        className="text-[10px]"
                      >
                        {p.paymentStatus}
                      </Badge>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          setSelectedPayslip(p);
                          setShowPayslipModal(true);
                        }}
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" /> Payslip
                      </Button>
                      {p.paymentStatus !== 'PAID' && (
                        <Button
                          size="sm"
                          className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white font-bold"
                          onClick={() => {
                            setDisburseTarget(p);
                            setDisburseForm({
                              paymentMode: 'BANK_TRANSFER',
                              referenceNo: `SAL-${p.payrollMonth}-${p.empId}`,
                              notes: '',
                            });
                            setShowDisburseModal(true);
                          }}
                        >
                          Disburse
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal: View Printable Payslip */}
        {showPayslipModal && selectedPayslip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
            <div className="bg-white text-zinc-900 rounded-xl p-8 max-w-2xl w-full space-y-5 max-h-[92vh] overflow-y-auto shadow-2xl">
              {/* Slip Header */}
              <div className="text-center border-b pb-4">
                <h2 className="text-lg font-black tracking-tight uppercase text-zinc-950">
                  HAION ENTERPRISE PRIVATE LIMITED
                </h2>
                <p className="text-xs text-zinc-600">Plot 12, Tech Park Sector 62, Industrial Area, New Delhi - 110001</p>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">Corporate ID: U31909DL2024PTC123456 • PAN: AABCH1234F</p>
                <div className="mt-2 inline-block bg-zinc-100 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider text-zinc-800">
                  Salary Slip for the Month of {selectedPayslip.payrollMonth}
                </div>
              </div>

              {/* Employee Particulars */}
              <div className="grid grid-cols-2 gap-4 text-xs border p-3 rounded-lg bg-zinc-50/60 font-mono">
                <div>
                  <span className="text-zinc-500 block text-[10.5px] font-sans">Employee Name:</span>
                  <span className="font-bold text-zinc-900">{selectedPayslip.employeeName}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10.5px] font-sans">Employee ID:</span>
                  <span className="font-bold text-zinc-900">{selectedPayslip.empId}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10.5px] font-sans">Department / Designation:</span>
                  <span className="text-zinc-900">{selectedPayslip.department} - {selectedPayslip.designation}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10.5px] font-sans">Bank Account & IFSC:</span>
                  <span className="text-zinc-900">{selectedPayslip.bankDetails?.accountNumber || 'Pending'} ({selectedPayslip.bankDetails?.ifsc || 'N/A'})</span>
                </div>
              </div>

              {/* Earnings vs Deductions Table */}
              <div className="grid grid-cols-2 gap-0 border rounded-lg overflow-hidden text-xs">
                {/* Left: Earnings */}
                <div className="border-r">
                  <div className="bg-zinc-100 p-2 font-bold uppercase text-zinc-700 tracking-wider">Earnings (₹)</div>
                  <div className="p-3 space-y-1.5 font-mono text-zinc-800">
                    <div className="flex justify-between">
                      <span>Basic Salary:</span>
                      <span>₹{(selectedPayslip.earnings?.basic || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>HRA:</span>
                      <span>₹{(selectedPayslip.earnings?.hra || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conveyance:</span>
                      <span>₹{(selectedPayslip.earnings?.conveyance || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Special Allowances:</span>
                      <span>₹{(selectedPayslip.earnings?.allowances || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-1.5 text-zinc-950">
                      <span>Gross Earnings:</span>
                      <span>₹{(selectedPayslip.grossSalary || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Deductions */}
                <div>
                  <div className="bg-zinc-100 p-2 font-bold uppercase text-zinc-700 tracking-wider">Deductions (₹)</div>
                  <div className="p-3 space-y-1.5 font-mono text-zinc-800">
                    <div className="flex justify-between">
                      <span>Provident Fund (PF):</span>
                      <span>₹{(selectedPayslip.deductions?.pf || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ESIC:</span>
                      <span>₹{(selectedPayslip.deductions?.esi || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Professional Tax (PT):</span>
                      <span>₹{(selectedPayslip.deductions?.professionalTax || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TDS / Income Tax:</span>
                      <span>₹{(selectedPayslip.deductions?.tds || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-1.5 text-red-600">
                      <span>Total Deductions:</span>
                      <span>₹{(selectedPayslip.totalDeductions || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay Banner */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-600 font-semibold block">Net Payable Amount</span>
                  <span className="text-xs text-zinc-500 font-mono">Payment Mode: {selectedPayslip.paymentMode || 'Direct Bank Deposit'}</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-zinc-950 font-mono">
                    ₹{(selectedPayslip.netSalary || 0).toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-green-700 font-bold uppercase">
                    Status: {selectedPayslip.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-zinc-400 text-center italic pt-1">
                This is a computer-generated salary slip and requires no physical signature.
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs text-zinc-900">
                  <Printer className="h-3.5 w-3.5 mr-1" /> Print Salary Slip
                </Button>
                <Button size="sm" onClick={() => setShowPayslipModal(false)} className="text-xs">
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Disburse Salary & Record to Company Ledger */}
        {showDisburseModal && disburseTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="bg-surface-1 border border-surface-3 rounded-xl p-6 max-w-md w-full space-y-4">
              <div className="flex items-center justify-between border-b border-surface-2 pb-3">
                <h3 className="text-base font-bold text-surface-900">
                  Disburse Salary: {disburseTarget.employeeName}
                </h3>
                <button onClick={() => setShowDisburseModal(false)} className="text-surface-400 hover:text-white">
                  ✕
                </button>
              </div>

              <div className="p-3 bg-surface-2/40 rounded-xl border border-surface-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-surface-500">Employee:</span>
                  <span className="font-bold text-surface-900">{disburseTarget.employeeName} ({disburseTarget.empId})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Month:</span>
                  <span className="font-semibold text-amber-400">{disburseTarget.payrollMonth}</span>
                </div>
                <div className="flex justify-between border-t border-surface-3 pt-1">
                  <span className="text-surface-500 font-bold">Net Salary:</span>
                  <span className="font-bold text-green-400 text-sm">₹{disburseTarget.netSalary?.toLocaleString()}</span>
                </div>
              </div>

              <form onSubmit={handleDisburse} className="space-y-3 text-xs">
                <div>
                  <Label className="text-xs">Payment Mode</Label>
                  <select
                    className="w-full h-9 rounded-md border border-surface-3 bg-surface-1 px-3 text-xs"
                    value={disburseForm.paymentMode}
                    onChange={(e) => setDisburseForm({ ...disburseForm, paymentMode: e.target.value })}
                  >
                    <option value="BANK_TRANSFER">Direct Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI Transfer</option>
                    <option value="CHEQUE">Corporate Cheque</option>
                    <option value="CASH">Cash in Hand</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs">Transaction Reference / UTR Number</Label>
                  <Input
                    placeholder="e.g. UTR12345678"
                    value={disburseForm.referenceNo}
                    onChange={(e) => setDisburseForm({ ...disburseForm, referenceNo: e.target.value })}
                  />
                </div>

                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>Automatically posts an <b>EXPENSE</b> transaction in the Company Ledger upon confirmation.</span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-surface-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowDisburseModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={disbursing}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold"
                  >
                    {disbursing ? 'Recording...' : 'Confirm & Post to Ledger'}
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

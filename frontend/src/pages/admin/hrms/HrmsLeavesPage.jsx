import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Calendar,
  User,
  Building2,
  Check,
  X,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { hrmsService } from '@/services/hrms.service';
import { employeesService } from '@/services/employees.service';
import { toast } from '@/utils/toast';

export default function HrmsLeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Apply Leave Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({
    employeeId: '',
    leaveType: 'CASUAL',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    daysCount: 1,
    reason: '',
  });
  const [submittingApply, setSubmittingApply] = useState(false);

  // Review Dialog
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Holiday Calendar Modal
  const [showHolidaysModal, setShowHolidaysModal] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await hrmsService.getLeaveRequests({
        status: statusFilter || undefined,
        search: search || undefined,
        perPage: 50,
      });
      setLeaves(res.data || []);
    } catch {
      toast.error('Failed to load leave applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await employeesService.getList({ status: 'ACTIVE', perPage: 150 });
      setEmployees(res.data || []);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter, search]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!applyForm.employeeId || !applyForm.reason.trim()) {
      return toast.error('Select employee and enter reason');
    }

    setSubmittingApply(true);
    try {
      await hrmsService.createLeaveRequest(applyForm);
      toast.success('Leave application submitted successfully!');
      setShowApplyModal(false);
      setApplyForm({
        employeeId: '',
        leaveType: 'CASUAL',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        daysCount: 1,
        reason: '',
      });
      fetchLeaves();
    } catch (err) {
      toast.error(err.message || 'Failed to submit leave');
    } finally {
      setSubmittingApply(false);
    }
  };

  const handleReviewAction = async (action) => {
    if (!selectedLeave) return;
    setReviewing(true);
    try {
      await hrmsService.reviewLeaveRequest(selectedLeave._id || selectedLeave.id, {
        action,
        remarks: reviewRemarks,
      });
      toast.success(`Leave application ${action === 'APPROVE' ? 'Approved' : 'Rejected'}`);
      setShowReviewModal(false);
      setSelectedLeave(null);
      setReviewRemarks('');
      fetchLeaves();
    } catch (err) {
      toast.error(err.message || 'Failed to review leave request');
    } finally {
      setReviewing(false);
    }
  };

  const pendingCount = leaves.filter((l) => l.status === 'PENDING').length;
  const approvedCount = leaves.filter((l) => l.status === 'APPROVED').length;
  const rejectedCount = leaves.filter((l) => l.status === 'REJECTED').length;

  const holidays = [
    { date: '2026-01-26', name: 'Republic Day', day: 'Monday' },
    { date: '2026-03-03', name: 'Holi Festival', day: 'Tuesday' },
    { date: '2026-04-14', name: 'Dr. Ambedkar Jayanti', day: 'Tuesday' },
    { date: '2026-05-01', name: 'May Day (Labor Day)', day: 'Friday' },
    { date: '2026-08-15', name: 'Independence Day', day: 'Saturday' },
    { date: '2026-10-02', name: 'Gandhi Jayanti', day: 'Friday' },
    { date: '2026-10-20', name: 'Dussehra (Vijayadashami)', day: 'Tuesday' },
    { date: '2026-11-08', name: 'Diwali (Deepavali)', day: 'Sunday' },
    { date: '2026-12-25', name: 'Christmas Day', day: 'Friday' },
  ];

  return (
    <PageShell
      title="Leave Management & Approval Workflows"
      subtitle="Process employee leave requests, track balances (Casual, Sick, Earned), and manage company holidays"
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowHolidaysModal(true)}>
            <Calendar className="h-4 w-4 mr-1.5" /> Holiday Calendar
          </Button>
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
            onClick={() => setShowApplyModal(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" /> Record / Apply Leave
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Status Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-300 font-semibold block uppercase">Pending Review</span>
              <span className="text-2xl font-bold text-amber-400">{pendingCount}</span>
            </div>
            <Clock className="h-6 w-6 text-amber-400/60" />
          </div>
          <div className="p-3.5 rounded-xl border border-green-500/30 bg-green-500/10 flex items-center justify-between">
            <div>
              <span className="text-xs text-green-300 font-semibold block uppercase">Approved Leaves</span>
              <span className="text-2xl font-bold text-green-400">{approvedCount}</span>
            </div>
            <CheckCircle2 className="h-6 w-6 text-green-400/60" />
          </div>
          <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center justify-between">
            <div>
              <span className="text-xs text-red-300 font-semibold block uppercase">Rejected Leaves</span>
              <span className="text-2xl font-bold text-red-400">{rejectedCount}</span>
            </div>
            <XCircle className="h-6 w-6 text-red-400/60" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-surface-1 p-3.5 rounded-xl border border-surface-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-surface-400" />
            <Input
              placeholder="Search by Request #, Employee, Department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <select
            className="h-9 rounded-md border border-surface-3 bg-surface-1 px-3 text-xs text-surface-900 focus:outline-hidden"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Leaves Table */}
        <div className="bg-surface-1 border border-surface-3 rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs text-surface-500">Loading leave requests...</div>
          ) : leaves.length === 0 ? (
            <div className="py-16 text-center text-xs text-surface-500 space-y-2">
              <CalendarDays className="h-10 w-10 text-surface-400 mx-auto opacity-60" />
              <p className="font-semibold text-surface-700">No leave requests found</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 text-surface-700 uppercase font-semibold">
                <tr>
                  <th className="p-3">Req #</th>
                  <th className="p-3">Staff Member</th>
                  <th className="p-3">Leave Type</th>
                  <th className="p-3">Duration & Dates</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-2">
                {leaves.map((l) => (
                  <tr key={l._id || l.id} className="hover:bg-surface-2/30">
                    <td className="p-3 font-mono font-bold text-amber-400">{l.requestNo}</td>
                    <td className="p-3 font-semibold text-surface-900">
                      {l.employeeName}
                      <span className="block text-[10.5px] text-surface-500 font-normal">
                        {l.empId} • {l.department}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-surface-900">{l.leaveType}</span>
                    </td>
                    <td className="p-3 text-surface-600">
                      <span className="font-bold text-surface-900 block">{l.daysCount} Day(s)</span>
                      <span className="text-[11px] text-surface-500">
                        {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-3 text-surface-600 max-w-xs truncate" title={l.reason}>
                      {l.reason}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          l.status === 'APPROVED' ? 'success' : l.status === 'PENDING' ? 'warning' : 'danger'
                        }
                        className="text-[10px]"
                      >
                        {l.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {l.status === 'PENDING' ? (
                        <Button
                          size="sm"
                          className="h-7 px-2.5 text-xs bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
                          onClick={() => {
                            setSelectedLeave(l);
                            setReviewRemarks('');
                            setShowReviewModal(true);
                          }}
                        >
                          Review Application
                        </Button>
                      ) : (
                        <span className="text-[11px] text-surface-400">
                          {l.reviewedAt ? `Reviewed on ${new Date(l.reviewedAt).toLocaleDateString()}` : 'Reviewed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal: Apply Leave */}
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="bg-surface-1 border border-surface-3 rounded-xl p-6 max-w-md w-full space-y-4">
              <div className="flex items-center justify-between border-b border-surface-2 pb-3">
                <h3 className="text-base font-bold text-surface-900">Record Staff Leave Application</h3>
                <button onClick={() => setShowApplyModal(false)} className="text-surface-400 hover:text-white">
                  ✕
                </button>
              </div>

              <form onSubmit={handleApplyLeave} className="space-y-3 text-xs">
                <div>
                  <Label className="text-xs">Employee *</Label>
                  <select
                    className="w-full h-9 rounded-md border border-surface-3 bg-surface-1 px-3 text-xs"
                    value={applyForm.employeeId}
                    onChange={(e) => setApplyForm({ ...applyForm, employeeId: e.target.value })}
                    required
                  >
                    <option value="">Select Staff Member</option>
                    {employees.map((e) => (
                      <option key={e.id || e._id} value={e.id || e._id}>
                        {e.name || `${e.firstName} ${e.lastName}`} ({e.empId} - {e.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs">Leave Type</Label>
                  <select
                    className="w-full h-9 rounded-md border border-surface-3 bg-surface-1 px-3 text-xs"
                    value={applyForm.leaveType}
                    onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value })}
                  >
                    <option value="CASUAL">Casual Leave (CL)</option>
                    <option value="SICK">Sick Leave (SL)</option>
                    <option value="EARNED">Earned / Privilege Leave (EL)</option>
                    <option value="UNPAID">Leave Without Pay (LWP)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Start Date *</Label>
                    <Input
                      type="date"
                      value={applyForm.startDate}
                      onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs">End Date *</Label>
                    <Input
                      type="date"
                      value={applyForm.endDate}
                      onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Days Count</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={applyForm.daysCount}
                    onChange={(e) => setApplyForm({ ...applyForm, daysCount: Number(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs">Reason for Leave *</Label>
                  <Input
                    placeholder="e.g. Medical emergency / Family function"
                    value={applyForm.reason}
                    onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-surface-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowApplyModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={submittingApply}
                    className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
                  >
                    {submittingApply ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Review Leave Application */}
        {showReviewModal && selectedLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="bg-surface-1 border border-surface-3 rounded-xl p-6 max-w-md w-full space-y-4">
              <div className="flex items-center justify-between border-b border-surface-2 pb-3">
                <h3 className="text-base font-bold text-surface-900">
                  Review Application: {selectedLeave.requestNo}
                </h3>
                <button onClick={() => setShowReviewModal(false)} className="text-surface-400 hover:text-white">
                  ✕
                </button>
              </div>

              <div className="p-3 bg-surface-2/40 rounded-xl border border-surface-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-surface-500">Employee:</span>
                  <span className="font-bold text-surface-900">{selectedLeave.employeeName} ({selectedLeave.empId})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Leave Type:</span>
                  <span className="font-semibold text-amber-400">{selectedLeave.leaveType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Duration:</span>
                  <span className="font-semibold text-surface-900">{selectedLeave.daysCount} Days</span>
                </div>
                <div className="pt-1 text-surface-600 border-t border-surface-3">
                  <span className="text-surface-500 block text-[10.5px]">Reason:</span>
                  {selectedLeave.reason}
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <Label className="text-xs">Review Remarks (Optional)</Label>
                <Input
                  placeholder="e.g. Approved as per casual leave policy"
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-surface-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={reviewing}
                  onClick={() => handleReviewAction('REJECT')}
                >
                  <X className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={reviewing}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold"
                  onClick={() => handleReviewAction('APPROVE')}
                >
                  <Check className="h-4 w-4 mr-1" /> Approve & Deduct Balance
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Holiday Calendar */}
        {showHolidaysModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="bg-surface-1 border border-surface-3 rounded-xl p-6 max-w-lg w-full space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-surface-2 pb-3">
                <div>
                  <h3 className="text-base font-bold text-surface-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-400" />
                    Company Holiday Calendar 2026
                  </h3>
                  <p className="text-xs text-surface-500">Official Gazetted & Corporate Holidays</p>
                </div>
                <button onClick={() => setShowHolidaysModal(false)} className="text-surface-400 hover:text-white">
                  ✕
                </button>
              </div>

              <div className="border border-surface-3 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-surface-2 uppercase font-semibold text-surface-700">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Holiday Name</th>
                      <th className="p-2.5">Day</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-2">
                    {holidays.map((h, i) => (
                      <tr key={i} className="hover:bg-surface-2/30">
                        <td className="p-2.5 font-mono font-semibold text-amber-400">
                          {new Date(h.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-2.5 font-medium text-surface-900">{h.name}</td>
                        <td className="p-2.5 text-surface-500">{h.day}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={() => setShowHolidaysModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

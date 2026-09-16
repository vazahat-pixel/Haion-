import { useEffect, useState } from 'react';
import {
  Clock,
  Calendar,
  CalendarCheck,
  Search,
  CheckCircle2,
  Users,
  Check,
  X,
  AlertCircle,
  FileSpreadsheet,
  Building2,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { hrmsService } from '@/services/hrms.service';
import { employeesService } from '@/services/employees.service';
import { toast } from '@/utils/toast';

export default function HrmsAttendancePage() {
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'matrix'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

  // Daily Register State
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingRowId, setSavingRowId] = useState(null);

  // Monthly Matrix State
  const [matrixData, setMatrixData] = useState([]);
  const [matrixLoading, setMatrixLoading] = useState(false);

  const fetchDailyData = async () => {
    setLoading(true);
    try {
      const [empRes, attRes] = await Promise.all([
        employeesService.getList({ department: department || undefined, status: 'ACTIVE', perPage: 150 }),
        hrmsService.getAttendanceList({ dateString: selectedDate, department: department || undefined, perPage: 150 }),
      ]);
      setEmployees(empRes.data || []);
      setAttendanceRecords(attRes.data || []);
    } catch {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatrixData = async () => {
    setMatrixLoading(true);
    try {
      const res = await hrmsService.getMonthlyMatrix({ month: selectedMonth, department: department || undefined });
      setMatrixData(res.matrix || []);
    } catch {
      toast.error('Failed to load monthly attendance sheet');
    } finally {
      setMatrixLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const depts = await hrmsService.getDepartments();
      setDepartments(depts || []);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (viewMode === 'daily') {
      fetchDailyData();
    } else {
      fetchMatrixData();
    }
  }, [viewMode, selectedDate, selectedMonth, department]);

  const getRecordForEmployee = (empId) => {
    return attendanceRecords.find((r) => String(r.employee?._id || r.employee) === String(empId));
  };

  const handleMarkSingle = async (employeeId, status, checkIn = '09:30 AM', checkOut = '06:30 PM', overtimeHours = 0) => {
    setSavingRowId(employeeId);
    try {
      await hrmsService.markAttendance({
        employeeId,
        date: selectedDate,
        status,
        checkIn,
        checkOut,
        overtimeHours,
      });
      toast.success('Attendance updated');
      fetchDailyData();
    } catch (err) {
      toast.error(err.message || 'Failed to update attendance');
    } finally {
      setSavingRowId(null);
    }
  };

  const handleBulkMarkPresent = async () => {
    if (employees.length === 0) return toast.error('No active employees to mark');
    const records = employees.map((emp) => ({
      employeeId: emp.id || emp._id,
      status: 'PRESENT',
      checkIn: '09:30 AM',
      checkOut: '06:30 PM',
      overtimeHours: 0,
    }));

    try {
      await hrmsService.bulkMarkAttendance({
        date: selectedDate,
        records,
      });
      toast.success(`Marked all ${employees.length} employees as PRESENT`);
      fetchDailyData();
    } catch (err) {
      toast.error(err.message || 'Failed to bulk mark attendance');
    }
  };

  // Daily Counters
  const presentCount = attendanceRecords.filter((r) => ['PRESENT', 'LATE'].includes(r.status)).length;
  const absentCount = attendanceRecords.filter((r) => r.status === 'ABSENT').length;
  const halfDayCount = attendanceRecords.filter((r) => r.status === 'HALF_DAY').length;
  const onLeaveCount = attendanceRecords.filter((r) => r.status === 'ON_LEAVE').length;

  // Days in selected month for matrix view
  const [yearStr, monthStr] = selectedMonth.split('-');
  const daysInMonth = new Date(Number(yearStr), Number(monthStr), 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <PageShell
      title="Attendance & Time Management"
      subtitle="Track daily employee check-ins, overtime hours, and monthly workforce attendance registers"
      actions={
        <div className="flex gap-2">
          {viewMode === 'daily' ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewMode('matrix')}
              >
                <FileSpreadsheet className="h-4 w-4 mr-1.5" /> View Monthly Matrix
              </Button>
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
                onClick={handleBulkMarkPresent}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark All Present Today
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewMode('daily')}
            >
              <Clock className="h-4 w-4 mr-1.5" /> Back to Daily Register
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Controls and Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-1 p-3.5 rounded-xl border border-surface-3">
          <div className="flex flex-wrap items-center gap-3">
            {viewMode === 'daily' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-surface-500">Date:</span>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-9 w-40 text-xs"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-surface-500">Month:</span>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="h-9 w-40 text-xs"
                />
              </div>
            )}

            <select
              className="h-9 rounded-md border border-surface-3 bg-surface-1 px-3 text-xs text-surface-900"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Daily Quick Counters */}
          {viewMode === 'daily' && (
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 border border-green-500/20">
                {presentCount} Present
              </span>
              <span className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                {absentCount} Absent
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {halfDayCount} Half-Day
              </span>
              <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {onLeaveCount} Leave
              </span>
            </div>
          )}
        </div>

        {/* View Mode 1: Daily Attendance Register */}
        {viewMode === 'daily' && (
          <div className="bg-surface-1 border border-surface-3 rounded-xl overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-xs text-surface-500">Loading daily attendance records...</div>
            ) : employees.length === 0 ? (
              <div className="py-16 text-center text-xs text-surface-500">No active employees found</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-2 text-surface-700 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Check-In</th>
                    <th className="p-3">Check-Out</th>
                    <th className="p-3">OT (Hrs)</th>
                    <th className="p-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-2">
                  {employees.map((emp) => {
                    const empId = emp.id || emp._id;
                    const rec = getRecordForEmployee(empId);
                    const currentStatus = rec?.status || 'UNMARKED';

                    return (
                      <tr key={empId} className="hover:bg-surface-2/30">
                        <td className="p-3 font-semibold text-surface-900">
                          {emp.name || `${emp.firstName} ${emp.lastName}`}
                          <span className="block font-mono text-[10.5px] text-amber-400 font-normal">
                            {emp.empId} • {emp.designation || 'Staff'}
                          </span>
                        </td>
                        <td className="p-3 text-surface-600">{emp.department}</td>
                        <td className="p-3">
                          <Badge
                            variant={
                              currentStatus === 'PRESENT'
                                ? 'success'
                                : currentStatus === 'LATE'
                                ? 'warning'
                                : currentStatus === 'ABSENT'
                                ? 'danger'
                                : currentStatus === 'HALF_DAY'
                                ? 'warning'
                                : currentStatus === 'ON_LEAVE'
                                ? 'info'
                                : 'secondary'
                            }
                            className="text-[10px]"
                          >
                            {currentStatus}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono text-surface-900">
                          {rec?.checkIn || '09:30 AM'}
                        </td>
                        <td className="p-3 font-mono text-surface-900">
                          {rec?.checkOut || '06:30 PM'}
                        </td>
                        <td className="p-3 font-mono text-surface-900">
                          {rec?.overtimeHours || 0}
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <Button
                            size="sm"
                            variant={currentStatus === 'PRESENT' ? 'default' : 'outline'}
                            className={`h-7 px-2 text-[11px] ${currentStatus === 'PRESENT' ? 'bg-green-600 text-white font-bold' : ''}`}
                            disabled={savingRowId === empId}
                            onClick={() => handleMarkSingle(empId, 'PRESENT')}
                          >
                            Present
                          </Button>
                          <Button
                            size="sm"
                            variant={currentStatus === 'HALF_DAY' ? 'default' : 'outline'}
                            className={`h-7 px-2 text-[11px] ${currentStatus === 'HALF_DAY' ? 'bg-amber-600 text-white' : ''}`}
                            disabled={savingRowId === empId}
                            onClick={() => handleMarkSingle(empId, 'HALF_DAY')}
                          >
                            Half-Day
                          </Button>
                          <Button
                            size="sm"
                            variant={currentStatus === 'ABSENT' ? 'default' : 'outline'}
                            className={`h-7 px-2 text-[11px] ${currentStatus === 'ABSENT' ? 'bg-red-600 text-white' : ''}`}
                            disabled={savingRowId === empId}
                            onClick={() => handleMarkSingle(empId, 'ABSENT', '-', '-')}
                          >
                            Absent
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* View Mode 2: Monthly Matrix Grid */}
        {viewMode === 'matrix' && (
          <div className="bg-surface-1 border border-surface-3 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-surface-900 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-amber-400" />
                  Monthly Attendance Matrix ({selectedMonth})
                </h3>
                <p className="text-[11px] text-surface-500">
                  P = Present (Green), A = Absent (Red), HD = Half-Day (Yellow), L = Leave (Blue)
                </p>
              </div>
            </div>

            {matrixLoading ? (
              <div className="py-16 text-center text-xs text-surface-500">Calculating monthly matrix...</div>
            ) : matrixData.length === 0 ? (
              <div className="py-16 text-center text-xs text-surface-500">No records found for this month</div>
            ) : (
              <div className="overflow-x-auto border border-surface-3 rounded-xl">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-surface-2 text-surface-700 uppercase font-semibold">
                    <tr>
                      <th className="p-2.5 sticky left-0 bg-surface-2 z-10">Staff Member</th>
                      <th className="p-2.5">Dept</th>
                      {daysArray.map((d) => (
                        <th key={d} className="p-2 text-center w-7 min-w-[28px]">
                          {d}
                        </th>
                      ))}
                      <th className="p-2 text-center text-green-400">P</th>
                      <th className="p-2 text-center text-red-400">A</th>
                      <th className="p-2 text-center text-amber-400">HD</th>
                      <th className="p-2 text-center text-blue-400">L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-2">
                    {matrixData.map((emp) => (
                      <tr key={emp.employeeId} className="hover:bg-surface-2/30 font-mono text-[11px]">
                        <td className="p-2.5 font-sans font-semibold text-surface-900 sticky left-0 bg-surface-1 z-10 border-r border-surface-3">
                          {emp.name}
                          <span className="block font-mono text-[10px] text-surface-500">{emp.empId}</span>
                        </td>
                        <td className="p-2.5 font-sans text-surface-500">{emp.department}</td>
                        {daysArray.map((dayNum) => {
                          const dateKey = `${selectedMonth}-${String(dayNum).padStart(2, '0')}`;
                          const record = emp.records[dateKey];
                          const status = record?.status;

                          let bg = 'text-surface-400';
                          let label = '·';
                          if (status === 'PRESENT' || status === 'LATE') {
                            bg = 'bg-green-500/20 text-green-400 font-bold';
                            label = 'P';
                          } else if (status === 'ABSENT') {
                            bg = 'bg-red-500/20 text-red-400 font-bold';
                            label = 'A';
                          } else if (status === 'HALF_DAY') {
                            bg = 'bg-amber-500/20 text-amber-400 font-bold';
                            label = 'HD';
                          } else if (status === 'ON_LEAVE') {
                            bg = 'bg-blue-500/20 text-blue-400 font-bold';
                            label = 'L';
                          }

                          return (
                            <td key={dayNum} className="p-1 text-center">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded ${bg}`}>
                                {label}
                              </span>
                            </td>
                          );
                        })}
                        <td className="p-2 text-center font-bold text-green-400 bg-green-500/5">
                          {emp.summary?.present || 0}
                        </td>
                        <td className="p-2 text-center font-bold text-red-400 bg-red-500/5">
                          {emp.summary?.absent || 0}
                        </td>
                        <td className="p-2 text-center font-bold text-amber-400 bg-amber-500/5">
                          {emp.summary?.halfDay || 0}
                        </td>
                        <td className="p-2 text-center font-bold text-blue-400 bg-blue-500/5">
                          {emp.summary?.leaves || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}

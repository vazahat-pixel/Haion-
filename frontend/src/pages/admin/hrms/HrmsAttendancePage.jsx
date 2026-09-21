import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Clock, Calendar, CalendarCheck, CheckCircle2, Users, FileSpreadsheet,
  MapPin, Navigation, Wifi, WifiOff, RefreshCw, ExternalLink, AlertTriangle,
  Building2, Car, Shield, Eye, CheckCheck, XCircle,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { hrmsService } from '@/services/hrms.service';
import { employeesService } from '@/services/employees.service';
import { toast } from '@/utils/toast';
import { env } from '@/config/env';

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_META = {
  PRESENT:  { label: 'Present',  bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  LATE:     { label: 'Late',     bg: 'bg-amber-500/15  text-amber-400  border-amber-500/25' },
  ABSENT:   { label: 'Absent',   bg: 'bg-red-500/15    text-red-400    border-red-500/25' },
  HALF_DAY: { label: 'Half Day', bg: 'bg-orange-500/15 text-orange-400 border-orange-500/25' },
  ON_LEAVE: { label: 'On Leave', bg: 'bg-blue-500/15   text-blue-400   border-blue-500/25' },
  HOLIDAY:  { label: 'Holiday',  bg: 'bg-purple-500/15 text-purple-400 border-purple-500/25' },
  WEEK_OFF: { label: 'Week Off', bg: 'bg-slate-500/15  text-slate-400  border-slate-500/25' },
  UNMARKED: { label: 'Unmarked', bg: 'bg-surface-3/60  text-[var(--color-text-tertiary)] border-surface-3' },
};

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.UNMARKED;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${meta.bg}`}>
      {meta.label}
    </span>
  );
}

function formatShiftHours(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function LiveTimer({ checkInTime }) {
  const [elapsed, setElapsed] = useState(Date.now() - new Date(checkInTime).getTime());
  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - new Date(checkInTime).getTime()), 10000);
    return () => clearInterval(t);
  }, [checkInTime]);
  return <span className="font-mono text-emerald-400 text-[11px]">{formatShiftHours(elapsed)}</span>;
}

// ── Google Maps / OSM Mini-Map ────────────────────────────────────────────────
function MiniMap({ lat, lng, label = 'EMP' }) {
  const apiKey = env.googleMapsApiKey;
  const [useIframe, setUseIframe] = useState(false);

  if (!lat || !lng) return null;
  const d = 0.005;
  const sanitizedLabel = (label || 'E').toString()[0].toUpperCase();

  return (
    <div className="overflow-hidden rounded-lg border border-surface-3 hover:border-brand-500/50 transition-all group">
      {useIframe || !apiKey ? (
        <iframe
          title="Location Preview"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`}
          className="w-full pointer-events-none"
          style={{ height: 80 }}
        />
      ) : (
        <img
          src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=400x160&markers=color:red%7Clabel:${sanitizedLabel}%7C${lat},${lng}&key=${apiKey}`}
          alt="Location"
          onError={() => setUseIframe(true)}
          className="w-full object-cover"
          style={{ height: 80 }}
        />
      )}
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        title="View on Google Maps"
        className="flex items-center justify-between px-2.5 py-1 bg-surface-2 text-[10px] text-brand-400 group-hover:text-brand-300 font-medium border-t border-surface-3"
      >
        <span className="font-mono text-[9.5px] text-zinc-400">{lat.toFixed(4)}, {lng.toFixed(4)}</span>
        <span className="flex items-center gap-1">
          <ExternalLink className="h-2.5 w-2.5" /> Open Google Maps
        </span>
      </a>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
export default function HrmsAttendancePage() {
  const [tab, setTab] = useState('live'); // 'live' | 'daily' | 'matrix'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

  // Daily State
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingRowId, setSavingRowId] = useState(null);

  // Monthly Matrix State
  const [matrixData, setMatrixData] = useState([]);
  const [matrixLoading, setMatrixLoading] = useState(false);

  // Live Monitor State
  const [liveData, setLiveData] = useState([]);
  const [liveMeta, setLiveMeta] = useState({});
  const [liveLoading, setLiveLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [workModeFilter, setWorkModeFilter] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);
  const liveRefreshRef = useRef(null);

  // ── Data Fetchers ──────────────────────────────────────────────────────────
  const fetchDepartments = useCallback(async () => {
    try { setDepartments((await hrmsService.getDepartments()) || []); } catch { /* silent */ }
  }, []);

  const fetchDailyData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, attRes] = await Promise.all([
        employeesService.getList({ department: department || undefined, status: 'ACTIVE', perPage: 150 }),
        hrmsService.getAttendanceList({ dateString: selectedDate, department: department || undefined, perPage: 150 }),
      ]);
      setEmployees(empRes.data || []);
      setAttendanceRecords(attRes.data || []);
    } catch { toast.error('Failed to load attendance records'); }
    finally { setLoading(false); }
  }, [selectedDate, department]);

  const fetchMatrixData = useCallback(async () => {
    setMatrixLoading(true);
    try {
      const res = await hrmsService.getMonthlyMatrix({ month: selectedMonth, department: department || undefined });
      setMatrixData(res.matrix || []);
    } catch { toast.error('Failed to load monthly sheet'); }
    finally { setMatrixLoading(false); }
  }, [selectedMonth, department]);

  const fetchLiveData = useCallback(async (silent = false) => {
    if (!silent) setLiveLoading(true);
    try {
      const res = await hrmsService.getLiveAttendance({ department: department || undefined, workMode: workModeFilter || undefined });
      setLiveData(res.data || []);
      setLiveMeta(res.meta || {});
      setLastRefreshed(new Date());
    } catch { if (!silent) toast.error('Failed to load live data'); }
    finally { if (!silent) setLiveLoading(false); }
  }, [department, workModeFilter]);

  // Auto-refresh live every 30 sec
  useEffect(() => {
    if (tab !== 'live') { clearInterval(liveRefreshRef.current); return; }
    fetchLiveData();
    liveRefreshRef.current = setInterval(() => fetchLiveData(true), 30_000);
    return () => clearInterval(liveRefreshRef.current);
  }, [tab, fetchLiveData]);

  useEffect(() => { fetchDepartments(); }, []);
  useEffect(() => { if (tab === 'daily') fetchDailyData(); }, [tab, fetchDailyData]);
  useEffect(() => { if (tab === 'matrix') fetchMatrixData(); }, [tab, fetchMatrixData]);

  // ── Daily Register helpers ─────────────────────────────────────────────────
  const getRecordForEmployee = (empId) =>
    attendanceRecords.find((r) => String(r.employee?._id || r.employee) === String(empId));

  const handleMarkSingle = async (employeeId, status, checkIn = '09:30 AM', checkOut = '06:30 PM', overtimeHours = 0) => {
    setSavingRowId(employeeId);
    try {
      await hrmsService.markAttendance({ employeeId, date: selectedDate, status, checkIn, checkOut, overtimeHours });
      toast.success('Attendance updated');
      fetchDailyData();
    } catch (err) { toast.error(err.message || 'Failed to update attendance'); }
    finally { setSavingRowId(null); }
  };

  const handleBulkMarkPresent = async () => {
    if (!employees.length) return toast.error('No active employees');
    try {
      await hrmsService.bulkMarkAttendance({
        date: selectedDate,
        records: employees.map((emp) => ({ employeeId: emp.id || emp._id, status: 'PRESENT', checkIn: '09:30 AM', checkOut: '06:30 PM', overtimeHours: 0 })),
      });
      toast.success(`Marked ${employees.length} employees as PRESENT`);
      fetchDailyData();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  // ── Field Visit Verification ───────────────────────────────────────────────
  const handleVerifyField = async (recordId, action) => {
    setVerifyingId(recordId);
    try {
      await hrmsService.verifyFieldAttendance(recordId, { action });
      toast.success(`Field visit ${action.toLowerCase()} successfully`);
      fetchLiveData(true);
    } catch (err) { toast.error(err.message || 'Failed to verify'); }
    finally { setVerifyingId(null); }
  };

  // ── Counters ───────────────────────────────────────────────────────────────
  const presentCount = attendanceRecords.filter((r) => ['PRESENT', 'LATE'].includes(r.status)).length;
  const absentCount  = attendanceRecords.filter((r) => r.status === 'ABSENT').length;
  const halfDayCount = attendanceRecords.filter((r) => r.status === 'HALF_DAY').length;
  const onLeaveCount = attendanceRecords.filter((r) => r.status === 'ON_LEAVE').length;

  const [yearStr, monthStr] = selectedMonth.split('-');
  const daysInMonth = new Date(Number(yearStr), Number(monthStr), 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // ── TAB CONFIG ─────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'live',   label: '🟢 Live Monitor',       icon: Wifi },
    { id: 'daily',  label: '📋 Daily Register',      icon: CalendarCheck },
    { id: 'matrix', label: '📊 Monthly Matrix',      icon: FileSpreadsheet },
  ];

  return (
    <PageShell
      title="Attendance & Time Management"
      subtitle="Real-time GPS punch tracking, daily register & monthly workforce matrix"
      actions={
        <div className="flex gap-2">
          {tab === 'live' && (
            <Button size="sm" variant="outline" onClick={() => fetchLiveData()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
          )}
          {tab === 'daily' && (
            <>
              <Button size="sm" variant="outline" onClick={fetchDailyData}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reload
              </Button>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold" onClick={handleBulkMarkPresent}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark All Present
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-surface-2/60 border border-surface-3 rounded-xl p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 ${
                tab === t.id
                  ? 'bg-surface-1 border border-surface-3 shadow-sm text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {t.id === 'live' && (
                <span className="relative flex h-2 w-2">
                  {tab === 'live' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${tab === 'live' ? 'bg-emerald-500' : 'bg-surface-5'}`} />
                </span>
              )}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Filters Bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-1 p-3 rounded-xl border border-surface-3">
          <div className="flex flex-wrap items-center gap-3">
            {tab === 'daily' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Date:</span>
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-9 w-40 text-xs" />
              </div>
            )}
            {tab === 'matrix' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Month:</span>
                <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="h-9 w-40 text-xs" />
              </div>
            )}
            <select
              className="h-9 rounded-md border border-surface-3 bg-surface-1 px-3 text-xs"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
            </select>
            {tab === 'live' && (
              <select
                className="h-9 rounded-md border border-surface-3 bg-surface-1 px-3 text-xs"
                value={workModeFilter}
                onChange={(e) => setWorkModeFilter(e.target.value)}
              >
                <option value="">All Modes</option>
                <option value="OFFICE">🏢 Office</option>
                <option value="FIELD">🚗 Field</option>
                <option value="REMOTE">🏠 Remote</option>
              </select>
            )}
          </div>

          {/* Live Stats Bar */}
          {tab === 'live' && liveMeta?.punchedIn !== undefined && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                🟢 {liveMeta.punchedIn} Active
              </span>
              <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                🏢 {liveMeta.inOffice} Office
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                🚗 {liveMeta.inField} Field
              </span>
              {liveMeta.pendingFieldVerifications > 0 && (
                <span className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                  ⚠️ {liveMeta.pendingFieldVerifications} Pending Verify
                </span>
              )}
              {lastRefreshed && (
                <span className="text-[10px] text-[var(--color-text-tertiary)] ml-2">
                  Auto-refresh • Last: {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>
          )}

          {/* Daily Stats */}
          {tab === 'daily' && (
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{presentCount} Present</span>
              <span className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">{absentCount} Absent</span>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">{halfDayCount} Half-Day</span>
              <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">{onLeaveCount} Leave</span>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: 🟢 LIVE GPS MONITOR                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 'live' && (
          <div>
            {liveLoading ? (
              <div className="py-20 text-center text-xs text-[var(--color-text-tertiary)]">
                <Wifi className="h-8 w-8 mx-auto mb-3 opacity-30 animate-pulse" />
                Loading live attendance data...
              </div>
            ) : liveData.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <Users className="h-10 w-10 mx-auto text-[var(--color-text-tertiary)] opacity-30" />
                <p className="text-sm font-semibold text-[var(--color-text-secondary)]">No attendance records for today</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">Employees can punch in using the clock button in the top bar</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {liveData.map((rec) => {
                  const isPunchedIn = rec.isPunchedIn;
                  const isField = rec.workMode === 'FIELD';
                  const lat = rec.checkInLocation?.latitude;
                  const lng = rec.checkInLocation?.longitude;
                  const empName = rec.employeeName || rec.employee?.firstName;
                  const pendingVerify = isField && rec.fieldDetails?.verificationStatus === 'PENDING';

                  return (
                    <div
                      key={rec._id}
                      className={`bg-surface-1 border rounded-xl p-3 space-y-2.5 transition-all ${
                        isPunchedIn
                          ? isField
                            ? 'border-amber-500/30 shadow-[0_0_0_1px_rgba(245,158,11,0.1)]'
                            : 'border-emerald-500/30 shadow-[0_0_0_1px_rgba(16,185,129,0.08)]'
                          : 'border-surface-3 opacity-75'
                      }`}
                    >
                      {/* Employee Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[var(--color-text-primary)] text-sm leading-tight truncate">{empName}</p>
                          <p className="text-[10.5px] text-[var(--color-text-tertiary)] font-mono">{rec.empId} • {rec.department}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <StatusPill status={rec.status} />
                          {isPunchedIn && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${
                              isField
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                              {isField ? '🚗 Field' : '🏢 Office'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Punch Times */}
                      <div className="grid grid-cols-3 gap-2 text-center text-[10.5px]">
                        <div className="bg-surface-2/60 rounded-lg py-1.5">
                          <p className="text-[var(--color-text-tertiary)] text-[9.5px] uppercase mb-0.5">In</p>
                          <p className="font-mono font-semibold text-[var(--color-text-primary)]">{rec.checkIn || '--'}</p>
                        </div>
                        <div className="bg-surface-2/60 rounded-lg py-1.5">
                          <p className="text-[var(--color-text-tertiary)] text-[9.5px] uppercase mb-0.5">Out</p>
                          <p className="font-mono font-semibold text-[var(--color-text-primary)]">{rec.checkOut || '--'}</p>
                        </div>
                        <div className="bg-surface-2/60 rounded-lg py-1.5">
                          <p className="text-[var(--color-text-tertiary)] text-[9.5px] uppercase mb-0.5">Shift</p>
                          {isPunchedIn && rec.checkInTime ? (
                            <LiveTimer checkInTime={rec.checkInTime} />
                          ) : (
                            <p className="font-semibold text-[var(--color-text-primary)]">{rec.totalHours || 0} hrs</p>
                          )}
                        </div>
                      </div>

                      {/* GPS Location + Mini Map */}
                      {lat && lng ? (
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-1.5 text-[10.5px] text-[var(--color-text-secondary)]">
                            <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-brand-400" />
                            <span className="leading-snug line-clamp-2">
                              {rec.checkInLocation?.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`}
                            </span>
                          </div>
                          <MiniMap lat={lat} lng={lng} label={empName || 'E'} />
                          {rec.checkInLocation?.distanceMeters != null && (
                            <div className={`flex items-center gap-1 text-[10px] font-semibold ${
                              rec.checkInLocation.isWithinGeofence ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {rec.checkInLocation.isWithinGeofence
                                ? <Shield className="h-3 w-3" />
                                : <AlertTriangle className="h-3 w-3" />
                              }
                              {rec.checkInLocation.isWithinGeofence
                                ? `Within geofence (${rec.checkInLocation.distanceMeters}m)`
                                : `⚠️ ${rec.checkInLocation.distanceMeters}m from workplace`
                              }
                            </div>
                          )}
                        </div>
                      ) : rec.checkInTime ? (
                        <p className="text-[10px] text-[var(--color-text-tertiary)] flex items-center gap-1">
                          <WifiOff className="h-3 w-3" /> No GPS location recorded
                        </p>
                      ) : null}

                      {/* Field Visit Details */}
                      {isField && rec.fieldDetails && (
                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-2 space-y-1 text-[10.5px]">
                          {rec.fieldDetails.clientName && (
                            <p className="font-semibold text-[var(--color-text-primary)]">👤 {rec.fieldDetails.clientName}</p>
                          )}
                          {rec.fieldDetails.siteName && (
                            <p className="text-[var(--color-text-secondary)]">📍 {rec.fieldDetails.siteName}</p>
                          )}
                          {rec.fieldDetails.purpose && (
                            <p className="text-[var(--color-text-secondary)]">🎯 {rec.fieldDetails.purpose}</p>
                          )}
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-bold border ${
                              rec.fieldDetails.verificationStatus === 'APPROVED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : rec.fieldDetails.verificationStatus === 'REJECTED'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {rec.fieldDetails.verificationStatus}
                            </span>
                            {pendingVerify && (
                              <div className="flex gap-1 ml-auto">
                                <button
                                  onClick={() => handleVerifyField(rec._id, 'APPROVED')}
                                  disabled={verifyingId === rec._id}
                                  className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[9.5px] font-bold border border-emerald-500/20 transition-all"
                                >
                                  <CheckCheck className="h-3 w-3" /> Approve
                                </button>
                                <button
                                  onClick={() => handleVerifyField(rec._id, 'REJECTED')}
                                  disabled={verifyingId === rec._id}
                                  className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 text-[9.5px] font-bold border border-red-500/20 transition-all"
                                >
                                  <XCircle className="h-3 w-3" /> Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Google Maps Full Link */}
                      {rec.googleMapsUrl && (
                        <a
                          href={rec.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[10.5px] text-brand-400 hover:text-brand-300 font-medium"
                        >
                          <Navigation className="h-3 w-3" />
                          Track Live on Google Maps
                          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: DAILY REGISTER                                              */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 'daily' && (
          <div className="bg-surface-1 border border-surface-3 rounded-xl overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-xs text-[var(--color-text-tertiary)]">Loading daily attendance records...</div>
            ) : employees.length === 0 ? (
              <div className="py-16 text-center text-xs text-[var(--color-text-tertiary)]">No active employees found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-2 text-[var(--color-text-secondary)] uppercase font-semibold text-[10.5px]">
                    <tr>
                      <th className="p-3">Staff Member</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Check-In</th>
                      <th className="p-3">Check-Out</th>
                      <th className="p-3">Mode</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">OT (Hrs)</th>
                      <th className="p-3 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-2">
                    {employees.map((emp) => {
                      const empId = emp.id || emp._id;
                      const rec = getRecordForEmployee(empId);
                      const lat = rec?.checkInLocation?.latitude;
                      const lng = rec?.checkInLocation?.longitude;

                      return (
                        <tr key={empId} className="hover:bg-surface-2/30">
                          <td className="p-3 font-semibold text-[var(--color-text-primary)]">
                            {emp.name || `${emp.firstName} ${emp.lastName}`}
                            <span className="block font-mono text-[10.5px] text-amber-400 font-normal">
                              {emp.empId} • {emp.designation || 'Staff'}
                            </span>
                          </td>
                          <td className="p-3 text-[var(--color-text-secondary)]">{emp.department}</td>
                          <td className="p-3">
                            <StatusPill status={rec?.status || 'UNMARKED'} />
                          </td>
                          <td className="p-3 font-mono text-[var(--color-text-primary)]">
                            {rec?.checkIn || (rec?.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--')}
                          </td>
                          <td className="p-3 font-mono text-[var(--color-text-primary)]">
                            {rec?.checkOut || '--'}
                          </td>
                          <td className="p-3">
                            {rec?.workMode ? (
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                                rec.workMode === 'OFFICE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : rec.workMode === 'FIELD' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-surface-3/60 text-[var(--color-text-tertiary)] border-surface-3'
                              }`}>
                                {rec.workMode === 'OFFICE' ? '🏢' : rec.workMode === 'FIELD' ? '🚗' : '📋'} {rec.workMode}
                              </span>
                            ) : (
                              <span className="text-[var(--color-text-tertiary)] text-[10px]">Manual</span>
                            )}
                          </td>
                          <td className="p-3">
                            {lat && lng ? (
                              <a
                                href={`https://maps.google.com/?q=${lat},${lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-brand-400 hover:text-brand-300 text-[10.5px] font-medium"
                              >
                                <MapPin className="h-3 w-3" />
                                View Map
                              </a>
                            ) : (
                              <span className="text-[var(--color-text-tertiary)] text-[10px]">—</span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-[var(--color-text-primary)]">{rec?.overtimeHours || 0}</td>
                          <td className="p-3 text-right space-x-1">
                            <button
                              onClick={() => handleMarkSingle(empId, 'PRESENT')}
                              disabled={savingRowId === empId}
                              className={`h-7 px-2.5 text-[10.5px] font-semibold rounded-md border transition-all ${
                                rec?.status === 'PRESENT' ? 'bg-emerald-600 text-white border-emerald-700' : 'border-surface-3 hover:border-emerald-500/50 hover:text-emerald-400 text-[var(--color-text-secondary)]'
                              }`}
                            >P</button>
                            <button
                              onClick={() => handleMarkSingle(empId, 'HALF_DAY')}
                              disabled={savingRowId === empId}
                              className={`h-7 px-2.5 text-[10.5px] font-semibold rounded-md border transition-all ${
                                rec?.status === 'HALF_DAY' ? 'bg-amber-600 text-white border-amber-700' : 'border-surface-3 hover:border-amber-500/50 hover:text-amber-400 text-[var(--color-text-secondary)]'
                              }`}
                            >½</button>
                            <button
                              onClick={() => handleMarkSingle(empId, 'ABSENT', '-', '-')}
                              disabled={savingRowId === empId}
                              className={`h-7 px-2.5 text-[10.5px] font-semibold rounded-md border transition-all ${
                                rec?.status === 'ABSENT' ? 'bg-red-600 text-white border-red-700' : 'border-surface-3 hover:border-red-500/50 hover:text-red-400 text-[var(--color-text-secondary)]'
                              }`}
                            >A</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: MONTHLY MATRIX                                              */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 'matrix' && (
          <div className="bg-surface-1 border border-surface-3 rounded-xl p-4 space-y-3">
            <div>
              <h3 className="font-bold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-amber-400" />
                Monthly Attendance Matrix ({selectedMonth})
              </h3>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                P = Present · A = Absent · HD = Half-Day · L = Leave · · = No record
              </p>
            </div>
            {matrixLoading ? (
              <div className="py-16 text-center text-xs text-[var(--color-text-tertiary)]">Calculating monthly matrix...</div>
            ) : matrixData.length === 0 ? (
              <div className="py-16 text-center text-xs text-[var(--color-text-tertiary)]">No records found for this month</div>
            ) : (
              <div className="overflow-x-auto border border-surface-3 rounded-xl">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-surface-2 text-[var(--color-text-secondary)] uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="p-2.5 sticky left-0 bg-surface-2 z-10">Staff</th>
                      <th className="p-2.5">Dept</th>
                      {daysArray.map((d) => (
                        <th key={d} className="p-2 text-center w-7 min-w-[28px]">{d}</th>
                      ))}
                      <th className="p-2 text-center text-emerald-400">P</th>
                      <th className="p-2 text-center text-red-400">A</th>
                      <th className="p-2 text-center text-amber-400">HD</th>
                      <th className="p-2 text-center text-blue-400">L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-2">
                    {matrixData.map((emp) => (
                      <tr key={emp.employeeId} className="hover:bg-surface-2/30 font-mono text-[11px]">
                        <td className="p-2.5 font-sans font-semibold text-[var(--color-text-primary)] sticky left-0 bg-surface-1 z-10 border-r border-surface-3">
                          {emp.name}
                          <span className="block font-mono text-[10px] text-[var(--color-text-tertiary)]">{emp.empId}</span>
                        </td>
                        <td className="p-2.5 font-sans text-[var(--color-text-secondary)]">{emp.department}</td>
                        {daysArray.map((dayNum) => {
                          const dateKey = `${selectedMonth}-${String(dayNum).padStart(2, '0')}`;
                          const record = emp.records[dateKey];
                          const status = record?.status;
                          const map = { PRESENT: ['bg-emerald-500/20 text-emerald-400', 'P'], LATE: ['bg-amber-400/20 text-amber-300', 'L'], ABSENT: ['bg-red-500/20 text-red-400', 'A'], HALF_DAY: ['bg-orange-500/20 text-orange-400', 'H'], ON_LEAVE: ['bg-blue-500/20 text-blue-400', 'L'] };
                          const [cls, lbl] = map[status] || ['text-surface-500', '·'];
                          return (
                            <td key={dayNum} className="p-1 text-center">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded font-bold text-[10px] ${cls}`}>{lbl}</span>
                            </td>
                          );
                        })}
                        <td className="p-2 text-center font-bold text-emerald-400 bg-emerald-500/5">{emp.summary?.present || 0}</td>
                        <td className="p-2 text-center font-bold text-red-400 bg-red-500/5">{emp.summary?.absent || 0}</td>
                        <td className="p-2 text-center font-bold text-amber-400 bg-amber-500/5">{emp.summary?.halfDay || 0}</td>
                        <td className="p-2 text-center font-bold text-blue-400 bg-blue-500/5">{emp.summary?.leaves || 0}</td>
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

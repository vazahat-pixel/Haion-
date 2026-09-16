import { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Edit2,
  Eye,
  Mail,
  Phone,
  Building2,
  Calendar,
  CreditCard,
  CheckCircle2,
  UserCheck,
  Shield,
  FileText,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { employeesService } from '@/services/employees.service';
import { hrmsService } from '@/services/hrms.service';
import { toast } from '@/utils/toast';

export default function HrmsEmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add / Edit Modal State
  const [showDrawer, setShowDrawer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEmpId, setCurrentEmpId] = useState(null);
  const [formTab, setFormTab] = useState('personal'); // 'personal' | 'job' | 'salary' | 'leaves'
  const [saving, setSaving] = useState(false);

  // 360 View Modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileEmp, setProfileEmp] = useState(null);

  const initialForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'MALE',
    dob: '',
    bloodGroup: '',
    address: '',
    emergencyContact: { name: '', relation: '', phone: '' },

    department: 'Operations',
    designation: 'Executive',
    employmentType: 'FULL_TIME',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    joinedAt: new Date().toISOString().split('T')[0],
    probationEndDate: '',

    salaryStructure: {
      ctc: 300000,
      basic: 12500,
      hra: 5000,
      conveyance: 1600,
      allowances: 5900,
      pfDeduction: 1500,
      esiDeduction: 0,
      professionalTax: 200,
      tds: 0,
    },
    bankDetails: {
      accountNumber: '',
      ifsc: '',
      bankName: '',
      branchName: '',
      upiId: '',
    },
    pan: '',
    aadhaar: '',

    leaveBalances: {
      cl: 12,
      sl: 10,
      el: 15,
    },
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await employeesService.getList({
        search,
        department: departmentFilter || undefined,
        status: statusFilter || undefined,
        perPage: 100,
      });
      setEmployees(res.data || []);
    } catch {
      toast.error('Failed to load employee directory');
    } finally {
      setLoading(false);
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
    fetchEmployees();
    fetchDepartments();
  }, [search, departmentFilter, statusFilter]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentEmpId(null);
    setFormData(initialForm);
    setFormTab('personal');
    setShowDrawer(true);
  };

  const handleOpenEdit = (emp) => {
    setIsEditing(true);
    setCurrentEmpId(emp.id || emp._id);
    setFormData({
      firstName: emp.firstName || emp.name?.split(' ')[0] || '',
      lastName: emp.lastName || emp.name?.split(' ').slice(1).join(' ') || '',
      email: emp.email || '',
      phone: emp.phone || '',
      gender: emp.gender || 'MALE',
      dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : '',
      bloodGroup: emp.bloodGroup || '',
      address: emp.address || '',
      emergencyContact: emp.emergencyContact || { name: '', relation: '', phone: '' },

      department: emp.department || 'Operations',
      designation: emp.designation || 'Staff',
      employmentType: emp.employmentType || 'FULL_TIME',
      role: emp.role || 'EMPLOYEE',
      status: emp.status || 'ACTIVE',
      joinedAt: emp.joinedAt ? new Date(emp.joinedAt).toISOString().split('T')[0] : '',
      probationEndDate: emp.probationEndDate ? new Date(emp.probationEndDate).toISOString().split('T')[0] : '',

      salaryStructure: {
        ctc: emp.salaryStructure?.ctc || 300000,
        basic: emp.salaryStructure?.basic || 12500,
        hra: emp.salaryStructure?.hra || 5000,
        conveyance: emp.salaryStructure?.conveyance || 1600,
        allowances: emp.salaryStructure?.allowances || 5900,
        pfDeduction: emp.salaryStructure?.pfDeduction || 1500,
        esiDeduction: emp.salaryStructure?.esiDeduction || 0,
        professionalTax: emp.salaryStructure?.professionalTax || 200,
        tds: emp.salaryStructure?.tds || 0,
      },
      bankDetails: {
        accountNumber: emp.bankDetails?.accountNumber || '',
        ifsc: emp.bankDetails?.ifsc || '',
        bankName: emp.bankDetails?.bankName || '',
        branchName: emp.bankDetails?.branchName || '',
        upiId: emp.bankDetails?.upiId || '',
      },
      pan: emp.pan || '',
      aadhaar: emp.aadhaar || '',

      leaveBalances: {
        cl: emp.leaveBalances?.cl ?? 12,
        sl: emp.leaveBalances?.sl ?? 10,
        el: emp.leaveBalances?.el ?? 15,
      },
    });
    setFormTab('personal');
    setShowDrawer(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.email.trim()) {
      return toast.error('First Name and Email are required');
    }

    setSaving(true);
    try {
      if (isEditing) {
        await employeesService.update(currentEmpId, formData);
        toast.success('Employee profile updated successfully!');
      } else {
        await employeesService.create({
          ...formData,
          name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
        });
        toast.success('Staff member registered successfully!');
      }
      setShowDrawer(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err.message || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Staff Directory & 360° Employee Profiles"
      subtitle="Complete human resource register — job roles, organizational hierarchy, compensation structure, and bank records"
      actions={
        <Button
          size="sm"
          className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
          onClick={handleOpenCreate}
        >
          <Plus className="h-4 w-4 mr-1.5" /> Register New Employee
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-surface-1 p-3.5 rounded-xl border border-surface-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-surface-400" />
            <Input
              placeholder="Search by Employee ID, Name, Email, Role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <select
            className="h-9 rounded-md border border-surface-3 bg-surface-1 px-3 text-xs text-surface-900 focus:outline-hidden"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border border-surface-3 bg-surface-1 px-3 text-xs text-surface-900 focus:outline-hidden"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PROBATION">On Probation</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {/* Directory Table */}
        <div className="bg-surface-1 border border-surface-3 rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs text-surface-500">Loading workforce directory...</div>
          ) : employees.length === 0 ? (
            <div className="py-16 text-center text-xs text-surface-500 space-y-2">
              <Users className="h-10 w-10 text-surface-400 mx-auto opacity-60" />
              <p className="font-semibold text-surface-700">No staff members found</p>
              <Button size="sm" onClick={handleOpenCreate}>
                Add First Employee
              </Button>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 text-surface-700 uppercase font-semibold">
                <tr>
                  <th className="p-3">Emp ID</th>
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Department & Designation</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-2">
                {employees.map((emp) => (
                  <tr key={emp.id || emp._id} className="hover:bg-surface-2/30">
                    <td className="p-3 font-mono font-bold text-amber-400">{emp.empId}</td>
                    <td className="p-3 font-semibold text-surface-900">
                      {emp.name || `${emp.firstName} ${emp.lastName}`}
                      <span className="block text-[11px] text-surface-500 font-normal">
                        Joined {new Date(emp.joinedAt || emp.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-surface-900 block">{emp.designation || 'Staff'}</span>
                      <span className="text-[11px] text-surface-500">{emp.department}</span>
                    </td>
                    <td className="p-3 text-surface-600">
                      <span className="block">{emp.email}</span>
                      <span className="text-[11px] text-surface-500">{emp.phone || '—'}</span>
                    </td>
                    <td className="p-3 text-surface-600 font-mono text-[11px]">
                      {emp.employmentType || 'FULL_TIME'}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          emp.status === 'ACTIVE'
                            ? 'success'
                            : emp.status === 'PROBATION'
                            ? 'warning'
                            : emp.status === 'ON_LEAVE'
                            ? 'info'
                            : 'secondary'
                        }
                        className="text-[10px]"
                      >
                        {emp.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          setProfileEmp(emp);
                          setShowProfileModal(true);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> Dossier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleOpenEdit(emp)}
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal: Add / Edit Complete Employee */}
        {showDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="bg-surface-1 border border-surface-3 rounded-xl p-6 max-w-3xl w-full space-y-4 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-surface-2 pb-3">
                <div>
                  <h3 className="text-base font-bold text-surface-900">
                    {isEditing ? `Edit Staff Profile: ${formData.firstName} ${formData.lastName}` : 'Register New Employee'}
                  </h3>
                  <p className="text-xs text-surface-500">Configure personal information, organizational role, and compensation</p>
                </div>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="text-surface-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Form Navigation Tabs */}
              <div className="flex border-b border-surface-3 text-xs font-semibold gap-3">
                <button
                  type="button"
                  onClick={() => setFormTab('personal')}
                  className={`pb-2 px-1 border-b-2 transition-colors ${
                    formTab === 'personal' ? 'border-amber-400 text-amber-400' : 'border-transparent text-surface-500'
                  }`}
                >
                  1. Personal & Contact
                </button>
                <button
                  type="button"
                  onClick={() => setFormTab('job')}
                  className={`pb-2 px-1 border-b-2 transition-colors ${
                    formTab === 'job' ? 'border-amber-400 text-amber-400' : 'border-transparent text-surface-500'
                  }`}
                >
                  2. Role & Hierarchy
                </button>
                <button
                  type="button"
                  onClick={() => setFormTab('salary')}
                  className={`pb-2 px-1 border-b-2 transition-colors ${
                    formTab === 'salary' ? 'border-amber-400 text-amber-400' : 'border-transparent text-surface-500'
                  }`}
                >
                  3. Salary & Bank Details
                </button>
                <button
                  type="button"
                  onClick={() => setFormTab('leaves')}
                  className={`pb-2 px-1 border-b-2 transition-colors ${
                    formTab === 'leaves' ? 'border-amber-400 text-amber-400' : 'border-transparent text-surface-500'
                  }`}
                >
                  4. Leave Entitlements
                </button>
              </div>

              <form onSubmit={handleSaveEmployee} className="space-y-4 text-xs">
                {/* Tab 1: Personal */}
                {formTab === 'personal' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">First Name *</Label>
                        <Input
                          placeholder="e.g. Rahul"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Last Name</Label>
                        <Input
                          placeholder="e.g. Sharma"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Official Email *</Label>
                        <Input
                          type="email"
                          placeholder="rahul.sharma@haion.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Phone Number *</Label>
                        <Input
                          placeholder="9876543210"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Gender</Label>
                        <select
                          className="w-full h-9 rounded-md border border-surface-3 bg-surface-1 px-2 text-xs"
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Date of Birth</Label>
                        <Input
                          type="date"
                          value={formData.dob}
                          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Blood Group</Label>
                        <Input
                          placeholder="O+, B+, A+"
                          value={formData.bloodGroup}
                          onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Permanent Residential Address</Label>
                      <Input
                        placeholder="House / Flat No, Street, City, State, PIN"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Tab 2: Job & Role */}
                {formTab === 'job' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Department *</Label>
                        <select
                          className="w-full h-9 rounded-md border border-surface-3 bg-surface-1 px-3 text-xs"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        >
                          {departments.map((d) => (
                            <option key={d.name} value={d.name}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Designation / Job Title *</Label>
                        <Input
                          placeholder="e.g. Senior Diagnostic Technician"
                          value={formData.designation}
                          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Employment Type</Label>
                        <select
                          className="w-full h-9 rounded-md border border-surface-3 bg-surface-1 px-2 text-xs"
                          value={formData.employmentType}
                          onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                        >
                          <option value="FULL_TIME">Full-time Regular</option>
                          <option value="PART_TIME">Part-time</option>
                          <option value="CONTRACT">Contractual</option>
                          <option value="INTERN">Intern</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">System Role</Label>
                        <select
                          className="w-full h-9 rounded-md border border-surface-3 bg-surface-1 px-2 text-xs"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                          <option value="EMPLOYEE">Staff / Employee</option>
                          <option value="MANAGER">Manager</option>
                          <option value="WAREHOUSE_MANAGER">Warehouse Manager</option>
                          <option value="CUSTOMER_SUPPORT">Customer Support</option>
                          <option value="MASTER_ADMIN">Administrator</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Employment Status</Label>
                        <select
                          className="w-full h-9 rounded-md border border-surface-3 bg-surface-1 px-2 text-xs"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="PROBATION">Probation</option>
                          <option value="ON_LEAVE">On Leave</option>
                          <option value="NOTICE_PERIOD">Notice Period</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Date of Joining</Label>
                        <Input
                          type="date"
                          value={formData.joinedAt}
                          onChange={(e) => setFormData({ ...formData, joinedAt: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Probation End Date</Label>
                        <Input
                          type="date"
                          value={formData.probationEndDate}
                          onChange={(e) => setFormData({ ...formData, probationEndDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Salary & Bank */}
                {formTab === 'salary' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3 p-3 bg-surface-2/40 rounded-xl border border-surface-3">
                      <div>
                        <Label className="text-xs">Annual CTC (₹)</Label>
                        <Input
                          type="number"
                          value={formData.salaryStructure.ctc}
                          onChange={(e) => {
                            const ctc = Number(e.target.value) || 0;
                            const monthly = Math.round(ctc / 12);
                            const basic = Math.round(monthly * 0.5);
                            const hra = Math.round(monthly * 0.2);
                            const conv = 1600;
                            const allow = Math.max(0, monthly - (basic + hra + conv));
                            setFormData({
                              ...formData,
                              salaryStructure: {
                                ...formData.salaryStructure,
                                ctc,
                                basic,
                                hra,
                                conveyance: conv,
                                allowances: allow,
                              },
                            });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Monthly Basic (₹)</Label>
                        <Input
                          type="number"
                          value={formData.salaryStructure.basic}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              salaryStructure: { ...formData.salaryStructure, basic: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Monthly HRA (₹)</Label>
                        <Input
                          type="number"
                          value={formData.salaryStructure.hra}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              salaryStructure: { ...formData.salaryStructure, hra: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">PF Deduction (₹)</Label>
                        <Input
                          type="number"
                          value={formData.salaryStructure.pfDeduction}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              salaryStructure: { ...formData.salaryStructure, pfDeduction: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">ESI Deduction (₹)</Label>
                        <Input
                          type="number"
                          value={formData.salaryStructure.esiDeduction}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              salaryStructure: { ...formData.salaryStructure, esiDeduction: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Professional Tax (₹)</Label>
                        <Input
                          type="number"
                          value={formData.salaryStructure.professionalTax}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              salaryStructure: { ...formData.salaryStructure, professionalTax: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-surface-2">
                      <div>
                        <Label className="text-xs">PAN Card Number</Label>
                        <Input
                          placeholder="ABCDE1234F"
                          value={formData.pan}
                          onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                          className="font-mono uppercase"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Aadhaar Number</Label>
                        <Input
                          placeholder="12-digit UID"
                          value={formData.aadhaar}
                          onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Bank Account Number</Label>
                        <Input
                          placeholder="Account No"
                          value={formData.bankDetails.accountNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bankDetails: { ...formData.bankDetails, accountNumber: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Bank IFSC Code</Label>
                        <Input
                          placeholder="e.g. HDFC0001234"
                          value={formData.bankDetails.ifsc}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bankDetails: { ...formData.bankDetails, ifsc: e.target.value.toUpperCase() },
                            })
                          }
                          className="font-mono uppercase"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Bank Name</Label>
                        <Input
                          placeholder="e.g. HDFC Bank"
                          value={formData.bankDetails.bankName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bankDetails: { ...formData.bankDetails, bankName: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 4: Leaves */}
                {formTab === 'leaves' && (
                  <div className="space-y-3">
                    <p className="text-xs text-surface-500">Annual Paid Leave Allotment (Days)</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-surface-2/40 border border-surface-3 rounded-lg text-center">
                        <Label className="text-xs">Casual Leave (CL)</Label>
                        <Input
                          type="number"
                          value={formData.leaveBalances.cl}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              leaveBalances: { ...formData.leaveBalances, cl: Number(e.target.value) },
                            })
                          }
                          className="mt-1 text-center font-bold"
                        />
                      </div>
                      <div className="p-3 bg-surface-2/40 border border-surface-3 rounded-lg text-center">
                        <Label className="text-xs">Sick Leave (SL)</Label>
                        <Input
                          type="number"
                          value={formData.leaveBalances.sl}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              leaveBalances: { ...formData.leaveBalances, sl: Number(e.target.value) },
                            })
                          }
                          className="mt-1 text-center font-bold"
                        />
                      </div>
                      <div className="p-3 bg-surface-2/40 border border-surface-3 rounded-lg text-center">
                        <Label className="text-xs">Earned Leave (EL)</Label>
                        <Input
                          type="number"
                          value={formData.leaveBalances.el}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              leaveBalances: { ...formData.leaveBalances, el: Number(e.target.value) },
                            })
                          }
                          className="mt-1 text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-surface-2">
                  <div className="flex gap-2">
                    {formTab !== 'personal' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (formTab === 'leaves') setFormTab('salary');
                          else if (formTab === 'salary') setFormTab('job');
                          else if (formTab === 'job') setFormTab('personal');
                        }}
                      >
                        ← Back
                      </Button>
                    )}
                    {formTab !== 'leaves' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (formTab === 'personal') setFormTab('job');
                          else if (formTab === 'job') setFormTab('salary');
                          else if (formTab === 'salary') setFormTab('leaves');
                        }}
                      >
                        Next Step →
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowDrawer(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={saving}
                      className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
                    >
                      {saving ? 'Saving...' : isEditing ? 'Update Profile' : 'Complete Registration'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: 360° Profile Dossier */}
        {showProfileModal && profileEmp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="bg-surface-1 border border-surface-3 rounded-xl p-6 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-surface-2 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-sm">
                    {profileEmp.firstName?.[0] || 'E'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-surface-900">
                      {profileEmp.name || `${profileEmp.firstName} ${profileEmp.lastName}`}
                    </h3>
                    <p className="text-xs text-surface-500 font-mono">
                      {profileEmp.empId} • {profileEmp.designation || 'Staff'} ({profileEmp.department})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-surface-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Contact & Personal */}
                <div className="p-3.5 bg-surface-2/40 rounded-xl border border-surface-3 space-y-2">
                  <h4 className="font-bold text-surface-900 uppercase tracking-wider text-[11px] text-amber-400">
                    Contact & Identification
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-surface-500 block text-[10.5px]">Email</span>
                      <span className="text-surface-900 font-medium">{profileEmp.email}</span>
                    </div>
                    <div>
                      <span className="text-surface-500 block text-[10.5px]">Phone</span>
                      <span className="text-surface-900 font-medium">{profileEmp.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-surface-500 block text-[10.5px]">Gender / Blood</span>
                      <span className="text-surface-900 font-medium">{profileEmp.gender || 'MALE'} / {profileEmp.bloodGroup || '—'}</span>
                    </div>
                    <div>
                      <span className="text-surface-500 block text-[10.5px]">PAN</span>
                      <span className="font-mono text-surface-900 font-medium">{profileEmp.pan || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-surface-500 block text-[10.5px]">Aadhaar</span>
                      <span className="font-mono text-surface-900 font-medium">{profileEmp.aadhaar || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-surface-500 block text-[10.5px]">Status</span>
                      <Badge variant="outline">{profileEmp.status}</Badge>
                    </div>
                  </div>
                </div>

                {/* Salary & Bank */}
                <div className="p-3.5 bg-surface-2/40 rounded-xl border border-surface-3 space-y-2">
                  <h4 className="font-bold text-surface-900 uppercase tracking-wider text-[11px] text-amber-400">
                    Compensation & Bank Details
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-surface-500 block text-[10.5px]">Annual CTC</span>
                      <span className="font-mono font-bold text-green-400">₹{(profileEmp.salaryStructure?.ctc || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-surface-500 block text-[10.5px]">Basic Salary</span>
                      <span className="font-mono text-surface-900">₹{(profileEmp.salaryStructure?.basic || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-surface-500 block text-[10.5px]">Bank Account</span>
                      <span className="font-mono text-surface-900">{profileEmp.bankDetails?.accountNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-surface-500 block text-[10.5px]">Bank IFSC</span>
                      <span className="font-mono text-surface-900">{profileEmp.bankDetails?.ifsc || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Leave Balances */}
                <div className="p-3.5 bg-surface-2/40 rounded-xl border border-surface-3 space-y-2">
                  <h4 className="font-bold text-surface-900 uppercase tracking-wider text-[11px] text-amber-400">
                    Paid Leave Balances
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="p-2 rounded bg-surface-1">
                      <span className="text-surface-500 text-[10.5px] block">Casual Leave (CL)</span>
                      <span className="text-sm font-bold text-surface-900">{profileEmp.leaveBalances?.cl ?? 12} Days</span>
                    </div>
                    <div className="p-2 rounded bg-surface-1">
                      <span className="text-surface-500 text-[10.5px] block">Sick Leave (SL)</span>
                      <span className="text-sm font-bold text-surface-900">{profileEmp.leaveBalances?.sl ?? 10} Days</span>
                    </div>
                    <div className="p-2 rounded bg-surface-1">
                      <span className="text-surface-500 text-[10.5px] block">Earned Leave (EL)</span>
                      <span className="text-sm font-bold text-surface-900">{profileEmp.leaveBalances?.el ?? 15} Days</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-surface-2">
                <Button size="sm" variant="outline" onClick={() => setShowProfileModal(false)}>
                  Close
                </Button>
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
                  onClick={() => {
                    setShowProfileModal(false);
                    handleOpenEdit(profileEmp);
                  }}
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

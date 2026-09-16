import { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Users,
  CheckCircle2,
  Briefcase,
  Layers,
  Search,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { hrmsService } from '@/services/hrms.service';
import { toast } from '@/utils/toast';

export default function HrmsDepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    headOfDepartment: '',
    designations: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const data = await hrmsService.getDepartments();
      setDepartments(data || []);
    } catch {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentId(null);
    setForm({
      code: '',
      name: '',
      headOfDepartment: '',
      designations: '',
      description: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (dept) => {
    setIsEditing(true);
    setCurrentId(dept._id || dept.id);
    setForm({
      code: dept.code || '',
      name: dept.name || '',
      headOfDepartment: dept.headOfDepartment || '',
      designations: (dept.designations || []).join(', '),
      description: dept.description || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Department name is required');

    setSaving(true);
    try {
      const designationsArray = form.designations
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        code: form.code,
        name: form.name.trim(),
        headOfDepartment: form.headOfDepartment.trim(),
        designations: designationsArray,
        description: form.description.trim(),
      };

      if (isEditing) {
        await hrmsService.updateDepartment(currentId, payload);
        toast.success('Department updated successfully');
      } else {
        await hrmsService.createDepartment(payload);
        toast.success('Department created successfully');
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      toast.error(err.message || 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const filtered = departments.filter(
    (d) =>
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageShell
      title="Departments & Designations Master"
      subtitle="Organizational structure, business units, job titles, and department staff strength"
      actions={
        <Button
          size="sm"
          className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
          onClick={handleOpenCreate}
        >
          <Plus className="h-4 w-4 mr-1.5" /> Add Department
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="flex items-center gap-3 bg-surface-1 p-3 rounded-xl border border-surface-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-surface-400" />
            <Input
              placeholder="Search departments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>

        {/* Departments Grid */}
        {loading ? (
          <div className="py-16 text-center text-xs text-surface-500">Loading departments...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-surface-500">No departments found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((dept) => (
              <div
                key={dept._id || dept.id}
                className="bg-surface-1 border border-surface-3 rounded-xl p-4.5 space-y-3 shadow-xs hover:border-amber-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-400 text-xs">{dept.code}</span>
                    <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                      <Users className="h-3 w-3" /> {dept.employeeCount || 0} Staff
                    </Badge>
                  </div>
                  <h3 className="font-bold text-base text-surface-900 mt-1">{dept.name}</h3>
                  <p className="text-xs text-surface-500 mt-0.5">
                    HOD: <span className="font-semibold text-surface-800">{dept.headOfDepartment || 'Unassigned'}</span>
                  </p>
                  {dept.description && (
                    <p className="text-xs text-surface-600 mt-2 line-clamp-2">{dept.description}</p>
                  )}

                  {/* Designations badges */}
                  <div className="mt-3 pt-3 border-t border-surface-2 space-y-1.5">
                    <span className="text-[11px] font-semibold text-surface-500 block uppercase tracking-wider">
                      Designations ({dept.designations?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {(dept.designations || []).map((desig, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-surface-2 text-[10.5px] font-medium text-surface-700 border border-surface-3"
                        >
                          {desig}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-surface-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => handleOpenEdit(dept)}
                  >
                    <Edit2 className="h-3 w-3 mr-1" /> Edit Structure
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add / Edit Department */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="bg-surface-1 border border-surface-3 rounded-xl p-6 max-w-md w-full space-y-4">
              <div className="flex items-center justify-between border-b border-surface-2 pb-3">
                <h3 className="text-base font-bold text-surface-900">
                  {isEditing ? `Edit Department: ${form.name}` : 'Add New Department'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-surface-400 hover:text-white">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3 text-xs">
                <div>
                  <Label className="text-xs">Department Code</Label>
                  <Input
                    placeholder="e.g. OPS, MFG, FIN"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="font-mono uppercase"
                  />
                </div>
                <div>
                  <Label className="text-xs">Department Name *</Label>
                  <Input
                    placeholder="e.g. Quality Assurance"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Head of Department (HOD)</Label>
                  <Input
                    placeholder="e.g. Rajesh Verma"
                    value={form.headOfDepartment}
                    onChange={(e) => setForm({ ...form, headOfDepartment: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Designations (Comma-separated)</Label>
                  <Input
                    placeholder="QA Lead, Inspector, Testing Technician"
                    value={form.designations}
                    onChange={(e) => setForm({ ...form, designations: e.target.value })}
                  />
                  <span className="text-[10.5px] text-surface-400 block mt-1">Separate multiple titles with commas.</span>
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Input
                    placeholder="Brief scope of this department"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-surface-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={saving}
                    className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
                  >
                    {saving ? 'Saving...' : isEditing ? 'Update Department' : 'Create Department'}
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

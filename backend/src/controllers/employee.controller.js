import Employee from '../models/Employee.model.js';
import EmployeeDealerAssignment from '../models/EmployeeDealerAssignment.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapEmployee } from '../utils/docMapper.util.js';
import { nextSequence } from '../utils/sequence.util.js';
import { logAudit } from '../services/audit.service.js';

export const listEmployees = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {
    ...buildSearchFilter(req.query.search, ['firstName', 'lastName', 'empId', 'email', 'department']),
  };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.department) filter.department = req.query.department;

  const [rows, total] = await Promise.all([
    Employee.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Employee.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapEmployee), total, page, perPage });
});

export const getEmployee = asyncHandler(async (req, res) => {
  const doc = await Employee.findById(req.params.id).lean();
  if (!doc) return sendError(res, { message: 'Employee not found', statusCode: 404 });
  return sendSuccess(res, { data: mapEmployee(doc) });
});

export const createEmployee = asyncHandler(async (req, res) => {
  const empId = req.body.empId || nextSequence('EMP');
  const doc = await Employee.create({
    empId,
    firstName: req.body.firstName || req.body.name?.split(' ')[0],
    lastName: req.body.lastName || req.body.name?.split(' ').slice(1).join(' ') || '',
    email: req.body.email,
    phone: req.body.phone,
    department: req.body.department,
    designation: req.body.designation,
    role: req.body.role,
    status: req.body.status || 'ACTIVE',
    manager: req.body.managerId || null,
    dealerId: req.body.dealerId || null,
    warehouseId: req.body.warehouseId || null,
    // ── Hierarchy fields ──────────────────────────────────────────────────
    vertical: req.body.vertical || '',
    subVertical: req.body.subVertical || '',
    hierarchyLevel: req.body.hierarchyLevel || '',
    territory: req.body.territory || {},
    serviceCenterId: req.body.serviceCenterId || null,
    joinedAt: req.body.joinedAt,
  });
  return sendCreated(res, { data: mapEmployee(doc.toObject()), message: 'Employee created' });
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  // UI sends `managerId`; mongoose expects `manager`.
  if (payload.managerId !== undefined) {
    payload.manager = payload.managerId || null;
    delete payload.managerId;
  }
  if (payload.dealerId !== undefined) {
    payload.dealerId = payload.dealerId || null;
  }
  if (payload.warehouseId !== undefined) {
    payload.warehouseId = payload.warehouseId || null;
  }
  if (payload.serviceCenterId !== undefined) {
    payload.serviceCenterId = payload.serviceCenterId || null;
  }

  const doc = await Employee.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).lean();
  if (!doc) return sendError(res, { message: 'Employee not found', statusCode: 404 });
  return sendSuccess(res, { data: mapEmployee(doc), message: 'Employee updated' });
});

export const getTeam = asyncHandler(async (req, res) => {
  const managerId = req.params.managerId;
  const rows = await Employee.find({ manager: managerId, status: 'ACTIVE' }).lean();
  return sendSuccess(res, { data: rows.map(mapEmployee) });
});

export const getHierarchy = asyncHandler(async (req, res) => {
  const { vertical, subVertical } = req.query;
  const allEmployees = await Employee.find({ status: { $ne: 'TERMINATED' } })
    .populate('dealerId', 'name code city')
    .populate('serviceCenterId', 'name code city')
    .lean();

  // Build N-level tree using employee.manager self-referencing chain
  const employeeMap = new Map();
  allEmployees.forEach((emp) => {
    employeeMap.set(String(emp._id), {
      ...mapEmployee(emp),
      vertical: emp.vertical || '',
      subVertical: emp.subVertical || '',
      hierarchyLevel: emp.hierarchyLevel || '',
      territory: emp.territory || {},
      dealer: emp.dealerId || null,
      serviceCenter: emp.serviceCenterId || null,
      children: [],
    });
  });

  const roots = [];
  allEmployees.forEach((emp) => {
    const node = employeeMap.get(String(emp._id));
    if (emp.manager && employeeMap.has(String(emp.manager))) {
      employeeMap.get(String(emp.manager)).children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Optional filter by vertical / subVertical
  let filtered = roots;
  if (vertical) {
    filtered = filtered.filter((r) => r.vertical === vertical);
  }
  if (subVertical) {
    filtered = filtered.filter((r) => r.subVertical === subVertical);
  }

  return sendSuccess(res, { data: filtered });
});

// ── Get all subordinates below a given employee (recursive) ─────────────
export const getSubordinates = asyncHandler(async (req, res) => {
  const rootId = req.params.id;
  const allEmployees = await Employee.find({ status: { $ne: 'TERMINATED' } }).lean();

  // Build parent → children map
  const childrenMap = {};
  allEmployees.forEach((emp) => {
    const mgr = String(emp.manager || '');
    if (!childrenMap[mgr]) childrenMap[mgr] = [];
    childrenMap[mgr].push(emp);
  });

  function collectAll(parentId) {
    const kids = childrenMap[parentId] || [];
    let result = [...kids];
    for (const kid of kids) {
      result = result.concat(collectAll(String(kid._id)));
    }
    return result;
  }

  const subordinates = collectAll(rootId);
  return sendSuccess(res, {
    data: subordinates.map(mapEmployee),
    count: subordinates.length,
  });
});

export const getEmployeeDealers = asyncHandler(async (req, res) => {
  const doc = await Employee.findById(req.params.id).lean();
  if (!doc) return sendError(res, { message: 'Employee not found', statusCode: 404 });

  const assignments = await EmployeeDealerAssignment.find({ employee: req.params.id })
    .populate('dealer')
    .lean();

  return sendSuccess(res, {
    data: assignments.map((a) => ({
      id: String(a._id),
      dealerId: String(a.dealer?._id || a.dealer),
      dealer: a.dealer ? { id: String(a.dealer._id), name: a.dealer.name, city: a.dealer.city } : null,
      target: a.target,
      zone: a.zone,
      lastVisit: a.lastVisit,
      contactName: a.contactName,
      contactPhone: a.contactPhone,
    })),
  });
});

export const setEmployeeDealers = asyncHandler(async (req, res) => {
  const employeeId = req.params.id;
  const doc = await Employee.findById(employeeId).lean();
  if (!doc) return sendError(res, { message: 'Employee not found', statusCode: 404 });

  const dealerIds = Array.isArray(req.body?.dealerIds) ? req.body.dealerIds : null;
  if (!dealerIds) return sendError(res, { message: 'dealerIds array is required', statusCode: 400 });

  // Replace assignments atomically for simplicity.
  await EmployeeDealerAssignment.deleteMany({ employee: employeeId });

  const toInsert = dealerIds.map((dealerId) => ({
    employee: employeeId,
    dealer: dealerId,
  }));

  if (toInsert.length) {
    await EmployeeDealerAssignment.insertMany(toInsert);
  }

  await logAudit({
    action: 'UPDATE',
    user: req.user?.email,
    userId: req.user?._id,
    module: 'Employees',
    ip: req.ip,
    resourceId: String(doc.empId || employeeId),
    metadata: { dealerIdsCount: dealerIds.length },
  });

  return sendSuccess(res, { data: { updated: true, dealerIds } });
});

export const getReportingLine = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id).lean();
  if (!employee) return sendError(res, { message: 'Employee not found', statusCode: 404 });

  const seen = new Set();
  const managerChain = [];

  // Build chain from immediate manager -> top manager
  let managerId = employee.manager;
  while (managerId && !seen.has(String(managerId))) {
    seen.add(String(managerId));
    // eslint-disable-next-line no-await-in-loop
    const mgr = await Employee.findById(managerId).lean();
    if (!mgr) break;
    managerChain.push(mapEmployee(mgr));
    managerId = mgr.manager;
  }

  // Direct reports: employees whose manager equals this employee
  const directReports = await Employee.find({ manager: employee._id, status: 'ACTIVE' }).lean();

  return sendSuccess(res, {
    data: {
      employee: mapEmployee(employee),
      managerChain, // immediate manager first
      directReports: directReports.map(mapEmployee),
      directReportsCount: directReports.length,
    },
  });
});

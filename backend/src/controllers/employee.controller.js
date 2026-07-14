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
    role: req.body.role,
    status: req.body.status || 'ACTIVE',
    manager: req.body.managerId,
    dealerId: req.body.dealerId,
    warehouseId: req.body.warehouseId,
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

  const doc = await Employee.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).lean();
  if (!doc) return sendError(res, { message: 'Employee not found', statusCode: 404 });
  return sendSuccess(res, { data: mapEmployee(doc), message: 'Employee updated' });
});

export const getTeam = asyncHandler(async (req, res) => {
  const managerId = req.params.managerId;
  const rows = await Employee.find({ manager: managerId, status: 'ACTIVE' }).lean();
  return sendSuccess(res, { data: rows.map(mapEmployee) });
});

export const getHierarchy = asyncHandler(async (_req, res) => {
  const managers = await Employee.find({ manager: null, status: 'ACTIVE' }).lean();
  const hierarchy = await Promise.all(
    managers.map(async (m) => {
      const team = await Employee.find({ manager: m._id }).lean();
      return { ...mapEmployee(m), team: team.map(mapEmployee) };
    })
  );
  return sendSuccess(res, { data: hierarchy });
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

import Employee from '../models/Employee.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapEmployee } from '../utils/docMapper.util.js';
import { nextSequence } from '../utils/sequence.util.js';

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
  const doc = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
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

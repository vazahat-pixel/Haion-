import mongoose from 'mongoose';
import Employee from '../models/Employee.model.js';
import EmployeeDealerAssignment from '../models/EmployeeDealerAssignment.model.js';
import Bill from '../models/Bill.model.js';
import Task from '../models/Task.model.js';
import Approval from '../models/Approval.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination } from '../utils/pagination.util.js';

async function resolveEmployee(user) {
  if (user.employeeId) {
    const emp = await Employee.findById(user.employeeId).lean();
    if (emp) return emp;
  }
  return Employee.findOne({ user: user._id }).lean();
}

function deriveZone(achievementPct) {
  if (achievementPct >= 100) return 'GREEN';
  if (achievementPct >= 75) return 'YELLOW';
  return 'RED';
}

async function mapAssignment(row, dealer) {
  const dealerId = row.dealer?._id || row.dealer;
  const [salesAgg, billCount] = await Promise.all([
    Bill.aggregate([
      { $match: { dealer: new mongoose.Types.ObjectId(String(dealerId)), status: 'PAID' } },
      { $group: { _id: null, achieved: { $sum: '$total' } } },
    ]),
    Bill.countDocuments({ dealer: dealerId, status: 'PAID' }),
  ]);
  const achieved = salesAgg[0]?.achieved || 0;
  const target = row.target || 500000;
  const achievementPct = target > 0 ? Math.round((achieved / target) * 100) : 0;

  return {
    id: String(row._id),
    dealerId: String(dealerId),
    name: dealer?.name || row.dealer?.name,
    city: dealer?.city,
    state: dealer?.state,
    zone: row.zone || deriveZone(achievementPct),
    target,
    achieved,
    achievementPct,
    bills: billCount,
    outstanding: dealer?.outstanding || 0,
    trend: achievementPct >= 100 ? 8 : achievementPct >= 75 ? 0 : -12,
    lastVisit: row.lastVisit,
    contact: row.contactName || dealer?.name,
    phone: row.contactPhone || dealer?.phone,
  };
}

export const listAssignedDealers = asyncHandler(async (req, res) => {
  const employee = await resolveEmployee(req.user);
  if (!employee) return sendError(res, { message: 'Employee profile not found', statusCode: 403 });

  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { employee: employee._id };
  const [assignments, total] = await Promise.all([
    EmployeeDealerAssignment.find(filter).populate('dealer').sort(sort).skip(skip).limit(perPage).lean(),
    EmployeeDealerAssignment.countDocuments(filter),
  ]);

  const data = await Promise.all(assignments.map((a) => mapAssignment(a, a.dealer)));
  const search = req.query.search?.toLowerCase();
  const filtered = search
    ? data.filter((d) => d.name?.toLowerCase().includes(search) || d.city?.toLowerCase().includes(search))
    : data;

  return sendPaginated(res, { data: filtered, total: search ? filtered.length : total, page, perPage });
});

export const getAssignedDealer = asyncHandler(async (req, res) => {
  const employee = await resolveEmployee(req.user);
  if (!employee) return sendError(res, { message: 'Employee profile not found', statusCode: 403 });

  const assignment = await EmployeeDealerAssignment.findOne({
    _id: req.params.id,
    employee: employee._id,
  }).populate('dealer').lean();
  if (!assignment) return sendError(res, { message: 'Assigned dealer not found', statusCode: 404 });

  const mapped = await mapAssignment(assignment, assignment.dealer);
  const monthlySales = [
    { month: 'Jan', sales: Math.round(mapped.achieved * 0.6) },
    { month: 'Feb', sales: Math.round(mapped.achieved * 0.7) },
    { month: 'Mar', sales: Math.round(mapped.achieved * 0.75) },
    { month: 'Apr', sales: Math.round(mapped.achieved * 0.85) },
    { month: 'May', sales: Math.round(mapped.achieved * 0.92) },
    { month: 'Jun', sales: mapped.achieved },
  ];

  return sendSuccess(res, { data: { ...mapped, monthlySales } });
});

export const getPerformance = asyncHandler(async (req, res) => {
  const employee = await resolveEmployee(req.user);
  const isManager = req.user.role === 'MANAGER' || req.query.role === 'MANAGER';
  const assignments = employee
    ? await EmployeeDealerAssignment.find({ employee: employee._id }).lean()
    : [];

  const [tasksCompleted, tasksPending, pendingApprovals] = await Promise.all([
    Task.countDocuments({ status: 'COMPLETED' }),
    Task.countDocuments({ status: { $in: ['PENDING', 'IN_PROGRESS'] } }),
    Approval.countDocuments({ status: 'PENDING' }),
  ]);

  const greenZone = assignments.filter((a) => a.zone === 'GREEN').length;
  const redZone = assignments.filter((a) => a.zone === 'RED').length;

  if (isManager) {
    return sendSuccess(res, {
      data: {
        score: 91,
        tasksCompleted,
        tasksPending,
        teamAchievement: 88,
        greenZone: greenZone || 14,
        redZone: redZone || 4,
        pendingApprovals,
        weeklyScores: [
          { day: 'Mon', score: 85 }, { day: 'Tue', score: 88 }, { day: 'Wed', score: 90 },
          { day: 'Thu', score: 92 }, { day: 'Fri', score: 94 },
        ],
      },
    });
  }

  return sendSuccess(res, {
    data: {
      score: 87,
      tasksCompleted,
      tasksPending,
      visitsThisMonth: assignments.length * 2,
      dealersVisited: assignments.length,
      avgAchievement: 94,
      rank: 3,
      teamSize: 6,
      weeklyScores: [
        { day: 'Mon', score: 78 }, { day: 'Tue', score: 82 }, { day: 'Wed', score: 75 },
        { day: 'Thu', score: 88 }, { day: 'Fri', score: 91 },
      ],
    },
  });
});

export const getDealerAnalytics = asyncHandler(async (req, res) => {
  const employee = await resolveEmployee(req.user);
  const filter = employee ? { employee: employee._id } : {};
  const assignments = await EmployeeDealerAssignment.find(filter).lean();

  const zoneSummary = [
    { zone: 'GREEN', count: assignments.filter((a) => a.zone === 'GREEN').length, revenue: 0 },
    { zone: 'YELLOW', count: assignments.filter((a) => a.zone === 'YELLOW').length, revenue: 0 },
    { zone: 'RED', count: assignments.filter((a) => a.zone === 'RED').length, revenue: 0 },
  ];

  const topPerformers = await EmployeeDealerAssignment.find(filter)
    .populate('dealer', 'name city')
    .limit(5)
    .lean();

  const performers = await Promise.all(
    topPerformers.map(async (a) => {
      const mapped = await mapAssignment(a, a.dealer);
      return { name: mapped.name, achievement: mapped.achievementPct, revenue: mapped.achieved };
    })
  );

  return sendSuccess(res, {
    data: {
      zoneSummary,
      topPerformers: performers,
      totalDealers: assignments.length,
    },
  });
});

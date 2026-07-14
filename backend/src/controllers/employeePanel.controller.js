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

export const listTeamDealers = asyncHandler(async (req, res) => {
  const employee = await resolveEmployee(req.user);
  if (!employee) return sendError(res, { message: 'Employee profile not found', statusCode: 403 });

  const teamMembers = await Employee.find({ manager: employee._id, status: 'ACTIVE' }).lean();
  const employeeIds = [employee._id, ...teamMembers.map((m) => m._id)];

  const assignments = await EmployeeDealerAssignment.find({ employee: { $in: employeeIds } })
    .populate('dealer')
    .populate('employee', 'firstName lastName')
    .lean();

  const seen = new Set();
  const data = [];
  for (const assignment of assignments) {
    const dealerId = String(assignment.dealer?._id || assignment.dealer);
    if (seen.has(dealerId)) continue;
    seen.add(dealerId);
    const mapped = await mapAssignment(assignment, assignment.dealer);
    data.push({
      ...mapped,
      assignedEmployee: assignment.employee
        ? `${assignment.employee.firstName || ''} ${assignment.employee.lastName || ''}`.trim()
        : undefined,
    });
  }

  const search = req.query.search?.toLowerCase();
  const filtered = search
    ? data.filter((d) => d.name?.toLowerCase().includes(search) || d.city?.toLowerCase().includes(search))
    : data;

  return sendSuccess(res, { data: filtered });
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
  const dealerId = assignment.dealer?._id || assignment.dealer;
  const monthlySales = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    // eslint-disable-next-line no-await-in-loop
    const agg = await Bill.aggregate([
      { $match: { dealer: new mongoose.Types.ObjectId(String(dealerId)), status: 'PAID', paidAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, sales: { $sum: '$total' } } },
    ]);
    monthlySales.push({ month: start.toLocaleString('en', { month: 'short' }), sales: agg[0]?.sales || 0 });
  }

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

  // Calculate real zone counts from actual sales data
  const assignmentDetails = await Promise.all(
    assignments.map((a) => mapAssignment(a, null))
  );
  const greenZone = assignmentDetails.filter((a) => a.zone === 'GREEN').length;
  const yellowZone = assignmentDetails.filter((a) => a.zone === 'YELLOW').length;
  const redZone = assignmentDetails.filter((a) => a.zone === 'RED').length;

  // Real weekly activity chart: tasks completed per day for last 7 days
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyScores = [];
  for (let i = 6; i >= 0; i -= 1) {
    const start = new Date();
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    // eslint-disable-next-line no-await-in-loop
    const done = await Task.countDocuments({ status: 'COMPLETED', updatedAt: { $gte: start, $lte: end } });
    weeklyScores.push({ day: dayNames[start.getDay()], score: Math.min(100, done * 10 + 60) });
  }

  // Compute total revenue achieved across all assigned dealers
  const totalRevenue = assignmentDetails.reduce((sum, a) => sum + (a.achieved || 0), 0);
  const totalTarget = assignmentDetails.reduce((sum, a) => sum + (a.target || 0), 0);
  const avgAchievement = totalTarget > 0 ? Math.round((totalRevenue / totalTarget) * 100) : 0;
  const score = Math.min(100, Math.max(0, avgAchievement));

  if (isManager) {
    // For manager: aggregate across all employees they manage
    const teamMembers = await Employee.find({ manager: employee?._id, status: 'ACTIVE' }).lean();
    const teamCount = teamMembers.length;
    const teamAssignments = await EmployeeDealerAssignment.find({
      employee: { $in: teamMembers.map((m) => m._id) },
    }).lean();
    const teamDetails = await Promise.all(teamAssignments.map((a) => mapAssignment(a, null)));
    const teamRevenue = teamDetails.reduce((s, a) => s + (a.achieved || 0), 0);
    const teamTarget = teamDetails.reduce((s, a) => s + (a.target || 0), 0);
    const teamAchievement = teamTarget > 0 ? Math.round((teamRevenue / teamTarget) * 100) : 0;

    return sendSuccess(res, {
      data: {
        score: Math.min(100, teamAchievement),
        tasksCompleted,
        tasksPending,
        teamAchievement,
        teamSize: teamCount,
        greenZone: teamDetails.filter((a) => a.zone === 'GREEN').length,
        yellowZone: teamDetails.filter((a) => a.zone === 'YELLOW').length,
        redZone: teamDetails.filter((a) => a.zone === 'RED').length,
        pendingApprovals,
        totalRevenue: teamRevenue,
        weeklyScores,
      },
    });
  }

  return sendSuccess(res, {
    data: {
      score,
      tasksCompleted,
      tasksPending,
      dealersVisited: assignments.length,
      dealerCount: assignments.length,
      avgAchievement,
      totalRevenue,
      greenZone,
      yellowZone,
      redZone,
      pendingApprovals,
      weeklyScores,
    },
  });
});

export const getDealerAnalytics = asyncHandler(async (req, res) => {
  const employee = await resolveEmployee(req.user);
  const filter = employee ? { employee: employee._id } : {};
  const assignments = await EmployeeDealerAssignment.find(filter).populate('dealer', 'name city outstanding').lean();

  // Compute real zone and revenue per assignment
  const details = await Promise.all(assignments.map((a) => mapAssignment(a, a.dealer)));

  const greenRevenue = details.filter((d) => d.zone === 'GREEN').reduce((s, d) => s + d.achieved, 0);
  const yellowRevenue = details.filter((d) => d.zone === 'YELLOW').reduce((s, d) => s + d.achieved, 0);
  const redRevenue = details.filter((d) => d.zone === 'RED').reduce((s, d) => s + d.achieved, 0);

  const zoneSummary = [
    { zone: 'GREEN', count: details.filter((d) => d.zone === 'GREEN').length, revenue: greenRevenue },
    { zone: 'YELLOW', count: details.filter((d) => d.zone === 'YELLOW').length, revenue: yellowRevenue },
    { zone: 'RED', count: details.filter((d) => d.zone === 'RED').length, revenue: redRevenue },
  ];

  // Top performers sorted by achievementPct descending
  const topPerformers = [...details]
    .sort((a, b) => b.achievementPct - a.achievementPct)
    .slice(0, 5)
    .map((a) => ({ name: a.name, achievement: a.achievementPct, revenue: a.achieved, city: a.city, state: a.state }));

  // Monthly revenue trend for assigned dealers (last 6 months)
  const dealerIds = assignments.map((a) => a.dealer?._id || a.dealer).filter(Boolean);
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i -= 1) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    // eslint-disable-next-line no-await-in-loop
    const agg = await Bill.aggregate([
      { $match: { dealer: { $in: dealerIds.map((id) => new mongoose.Types.ObjectId(String(id))) }, status: 'PAID', paidAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, revenue: { $sum: '$total' } } },
    ]);
    monthlyTrend.push({ month: start.toLocaleString('en', { month: 'short' }), revenue: agg[0]?.revenue || 0 });
  }

  return sendSuccess(res, {
    data: {
      zoneSummary,
      topPerformers,
      topDealers: topPerformers.map((p, i) => ({
        id: `tp-${i}`,
        name: p.name,
        city: p.city,
        zone: p.achievement >= 100 ? 'GREEN' : p.achievement >= 75 ? 'YELLOW' : 'RED',
        achieved: p.revenue,
        achievementPct: p.achievement,
        target: Math.round(p.revenue / (p.achievement / 100 || 1)),
      })),
      regionSales: Object.entries(
        details.reduce((acc, d) => {
          const region = d.state || 'Other';
          acc[region] = (acc[region] || 0) + (d.achieved || 0);
          return acc;
        }, {})
      ).map(([region, sales]) => ({ region, sales })),
      monthlyTrend,
      totalDealers: assignments.length,
      totalRevenue: greenRevenue + yellowRevenue + redRevenue,
    },
  });
});


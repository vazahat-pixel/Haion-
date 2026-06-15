const now = new Date();
const daysAgo = (n) => new Date(now.getTime() - n * 86400000).toISOString();

export const MOCK_ASSIGNED_DEALERS = [
  { id: 'ad1', dealerId: 'dl1', name: 'Sharma Motors', city: 'Jaipur', state: 'Rajasthan', zone: 'GREEN', target: 500000, achieved: 560000, achievementPct: 112, bills: 24, outstanding: 125000, trend: 12.4, lastVisit: daysAgo(3), contact: 'Rakesh Sharma', phone: '9876501234' },
  { id: 'ad2', dealerId: 'dl2', name: 'Patel Industries', city: 'Ahmedabad', state: 'Gujarat', zone: 'GREEN', target: 750000, achieved: 810000, achievementPct: 108, bills: 32, outstanding: 89000, trend: 8.2, lastVisit: daysAgo(7), contact: 'Kiran Patel', phone: '9876501235' },
  { id: 'ad3', dealerId: 'dl3', name: 'Kumar Traders', city: 'Lucknow', state: 'Uttar Pradesh', zone: 'RED', target: 300000, achieved: 204000, achievementPct: 68, bills: 8, outstanding: 45000, trend: -14.5, lastVisit: daysAgo(14), contact: 'Vikram Kumar', phone: '9876501236' },
  { id: 'ad4', dealerId: 'dl4', name: 'Singh Auto Parts', city: 'Chandigarh', state: 'Punjab', zone: 'GREEN', target: 400000, achieved: 448000, achievementPct: 112, bills: 18, outstanding: 62000, trend: 6.8, lastVisit: daysAgo(2), contact: 'Harpreet Singh', phone: '9876501237' },
  { id: 'ad5', dealerId: 'dl5', name: 'Reddy Engineering', city: 'Hyderabad', state: 'Telangana', zone: 'YELLOW', target: 450000, achieved: 382500, achievementPct: 85, bills: 14, outstanding: 78000, trend: -2.1, lastVisit: daysAgo(5), contact: 'Anil Reddy', phone: '9876501238' },
  { id: 'ad6', dealerId: 'dl6', name: 'Bose Machinery', city: 'Kolkata', state: 'West Bengal', zone: 'RED', target: 350000, achieved: 227500, achievementPct: 65, bills: 6, outstanding: 112000, trend: -18.3, lastVisit: daysAgo(21), contact: 'Subhash Bose', phone: '9876501239' },
  { id: 'ad7', dealerId: 'dl7', name: 'Nair Distributors', city: 'Kochi', state: 'Kerala', zone: 'GREEN', target: 320000, achieved: 358400, achievementPct: 112, bills: 15, outstanding: 34000, trend: 9.6, lastVisit: daysAgo(4), contact: 'Suresh Nair', phone: '9876501240' },
  { id: 'ad8', dealerId: 'dl8', name: 'Gupta Sales Corp', city: 'Indore', state: 'Madhya Pradesh', zone: 'YELLOW', target: 380000, achieved: 323000, achievementPct: 85, bills: 11, outstanding: 56000, trend: 1.2, lastVisit: daysAgo(9), contact: 'Amit Gupta', phone: '9876501241' },
];

export const MOCK_DEALER_MONTHLY_SALES = {
  ad1: [
    { month: 'Jan', sales: 380000 }, { month: 'Feb', sales: 420000 }, { month: 'Mar', sales: 450000 },
    { month: 'Apr', sales: 490000 }, { month: 'May', sales: 520000 }, { month: 'Jun', sales: 560000 },
  ],
  ad3: [
    { month: 'Jan', sales: 280000 }, { month: 'Feb', sales: 260000 }, { month: 'Mar', sales: 240000 },
    { month: 'Apr', sales: 220000 }, { month: 'May', sales: 210000 }, { month: 'Jun', sales: 204000 },
  ],
};

export const MOCK_EMPLOYEE_PERFORMANCE = {
  employee: {
    score: 87,
    tasksCompleted: 24,
    tasksPending: 12,
    visitsThisMonth: 18,
    dealersVisited: 14,
    avgAchievement: 94,
    rank: 3,
    teamSize: 6,
    weeklyScores: [
      { day: 'Mon', score: 78 }, { day: 'Tue', score: 82 }, { day: 'Wed', score: 75 },
      { day: 'Thu', score: 88 }, { day: 'Fri', score: 91 },
    ],
  },
  manager: {
    score: 91,
    tasksCompleted: 42,
    tasksPending: 8,
    teamAchievement: 88,
    greenZone: 14,
    redZone: 4,
    pendingApprovals: 5,
    weeklyScores: [
      { day: 'Mon', score: 85 }, { day: 'Tue', score: 88 }, { day: 'Wed', score: 90 },
      { day: 'Thu', score: 92 }, { day: 'Fri', score: 94 },
    ],
  },
};

export const MOCK_DEALER_ANALYTICS = {
  zoneSummary: [
    { zone: 'GREEN', count: 14, revenue: 4200000 },
    { zone: 'YELLOW', count: 6, revenue: 1850000 },
    { zone: 'RED', count: 4, revenue: 680000 },
  ],
  regionSales: [
    { region: 'North', sales: 1240000 },
    { region: 'West', sales: 2180000 },
    { region: 'South', sales: 1560000 },
    { region: 'East', sales: 980000 },
  ],
  topDealers: MOCK_ASSIGNED_DEALERS.filter((d) => d.zone === 'GREEN').slice(0, 5),
};

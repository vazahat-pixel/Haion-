const now = new Date();
const daysAgo = (n) => new Date(now.getTime() - n * 86400000).toISOString();
const hoursAgo = (n) => new Date(now.getTime() - n * 3600000).toISOString();

export const MOCK_COMPLAINT_TIMELINES = {
  c1: [
    { id: 't1', title: 'Complaint registered', description: 'Customer reported unusual motor noise', timestamp: daysAgo(1), variant: 'success' },
    { id: 't2', title: 'Assigned to support', description: 'Arjun Mehta assigned', timestamp: hoursAgo(20) },
    { id: 't3', title: 'Under investigation', description: 'Remote diagnostics initiated', timestamp: hoursAgo(8), variant: 'warning' },
  ],
  c2: [
    { id: 't4', title: 'Complaint registered', timestamp: daysAgo(3), variant: 'success' },
    { id: 't5', title: 'Technician visit scheduled', timestamp: daysAgo(2) },
    { id: 't6', title: 'In progress', description: 'Parts ordered for control panel', timestamp: daysAgo(1), variant: 'warning' },
  ],
  c3: [
    { id: 't7', title: 'Complaint registered', timestamp: daysAgo(5), variant: 'success' },
    { id: 't8', title: 'Escalated to senior support', timestamp: daysAgo(4), variant: 'danger' },
    { id: 't9', title: 'SLA breach', description: 'Response overdue by 48 hours', timestamp: daysAgo(2), variant: 'danger' },
  ],
};

export const MOCK_COMPLAINT_DETAILS = {
  c1: { slaHours: 48, slaRemaining: 36, slaStatus: 'ON_TRACK', description: 'Unusual noise during operation at high load' },
  c2: { slaHours: 48, slaRemaining: 12, slaStatus: 'AT_RISK', description: 'Display not responding after power surge' },
  c3: { slaHours: 24, slaRemaining: -48, slaStatus: 'BREACHED', description: 'Hydraulic pump leaking — critical production impact' },
};

export const MOCK_SERVICE_REQUEST_TIMELINES = {
  sr1: [
    { id: 'sr-t1', title: 'Request submitted', timestamp: daysAgo(3), variant: 'success' },
    { id: 'sr-t2', title: 'Technician assigned', timestamp: daysAgo(2) },
    { id: 'sr-t3', title: 'Visit scheduled', description: 'Jun 12, 10:00 AM', timestamp: daysAgo(1), variant: 'warning' },
  ],
  sr2: [
    { id: 'sr-t4', title: 'Request submitted', timestamp: daysAgo(1), variant: 'success' },
    { id: 'sr-t5', title: 'Under review', timestamp: hoursAgo(6) },
  ],
};

export const MOCK_SPARE_WORKFLOWS = {
  sp1: { steps: ['REQUESTED', 'APPROVED', 'DISPATCHED', 'DELIVERED'], currentStep: 2, eta: daysAgo(-2) },
  sp2: { steps: ['REQUESTED', 'APPROVED', 'DISPATCHED', 'DELIVERED'], currentStep: 0 },
};

export const MOCK_RETURN_WORKFLOWS = {
  r1: { steps: ['REQUESTED', 'RECEIVED', 'INSPECTED', 'RESOLVED'], currentStep: 3 },
  r2: { steps: ['REQUESTED', 'RECEIVED', 'INSPECTED', 'RESOLVED'], currentStep: 1 },
};

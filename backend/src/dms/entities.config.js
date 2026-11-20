/**
 * Declarative description of every generic DMS entity type. The same config is served to the
 * frontend (/api/dms/entities/schemas) so lists, forms and detail pages are generated from it.
 *
 * field: { n: name, l: label, t: type, req, opts, ref, def, full, readOnly }
 *   types: text | number | date | textarea | select | email | tel | url | ref | multiref | lines
 * type cfg:
 *   page        right needed to list-all / create / edit      selfPage  right that grants own-records access
 *   approvePage right for approve/reject actions + approval queue
 *   prefix/pad  docNo numbering (docNo omitted when no prefix)  initial  status on create
 *   cols        list columns (data field names or docNo/status/createdAt/createdByName)
 *   filters     data field names offered as list filters (select fields)
 *   dateField   data field the From/To filter applies to        global  skip location scoping
 */
const f = (n, l, t = 'text', x = {}) => ({ n, l, t, ...x });
const STATUS = f('status', 'Status', 'select', { opts: ['Active', 'Deactive'], def: 'Active' });

export const LEAD_STATUSES = [
  'Open', 'Active', 'Approve', 'Reject', 'Enquiry', 'Cold Call', 'Follow Up', 'Visit Scheduled', 'Demo Given', 'Negotiation',
  'Quote Shared', 'Sale Order', 'Won', 'Lost', 'On Hold', 'Callback', 'Not Interested', 'Dormant', 'Converted', 'Duplicate', 'Cancelled', 'Closed',
];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export { MONTHS };

const approve = (page, from = ['Pending']) => [
  { key: 'approve', label: 'Approve', from, to: 'Approved', page, remark: true },
  { key: 'reject', label: 'Reject', from, to: 'Rejected', page, remark: true },
];

export const ENTITY_TYPES = {
  /* ───────── Sale Force ───────── */
  lead: {
    label: 'Lead Details', title: 'Lead Details', page: 'lead', prefix: 'LD', pad: 5, initial: 'Open', docLabel: 'Lead Id',
    fields: [
      f('partyName', 'Party Name', 'text', { req: 1 }), f('contactPerson', 'Contact Person'), f('phone', 'Phone', 'tel'), f('email', 'Email', 'email'),
      f('area', 'Area / City', 'text', { req: 1 }), f('source', 'Source', 'select', { opts: ['Walk-in', 'Referral', 'Website', 'Cold Call', 'Exhibition', 'Other'] }),
      f('priority', 'Priority', 'select', { opts: ['High', 'Medium', 'Low'], def: 'Medium', req: 1 }), f('expectedValue', 'Expected Value', 'number'),
      f('followUpDate', 'Follow-up Date', 'date'), f('address', 'Address', 'textarea', { full: 1 }), f('remark', 'Remark', 'textarea', { full: 1 }),
    ],
    cols: ['docNo', 'partyName', 'priority', 'createdAt', 'status'], filters: ['priority'], statusFilter: LEAD_STATUSES, dateField: 'followUpDate',
    actions: [...approve('lead', ['Open']).map((a) => ({ ...a, to: a.key === 'approve' ? 'Approve' : 'Reject', label: a.key === 'approve' ? 'Lead Approval — Approve' : 'Lead Approval — Reject' })),
      { key: 'setStatus', label: 'Change Status', page: 'lead', remark: true, statuses: LEAD_STATUSES, from: LEAD_STATUSES.filter((s) => !['Closed', 'Cancelled'].includes(s)) }],
    extraActions: ['shareQuote'],
  },
  quote: {
    label: 'Quote', title: 'Quote', page: 'quote', prefix: 'QT', pad: 5, initial: 'Open', docLabel: 'Quote No',
    fields: [
      f('lead', 'Lead', 'ref', { ref: 'lead' }), f('partyName', 'Party Name', 'text', { req: 1 }), f('validTill', 'Valid Till', 'date'),
      f('lines', 'Items', 'lines', { req: 1, full: 1 }), f('remark', 'Remark', 'textarea', { full: 1 }),
    ],
    cols: ['docNo', 'createdByName', 'partyName', 'createdAt', 'status'], statusFilter: LEAD_STATUSES,
    actions: [
      { key: 'approve', label: 'Quote Approval — Approve', from: ['Open'], to: 'Approve', page: 'quote', remark: true },
      { key: 'reject', label: 'Quote Approval — Reject', from: ['Open'], to: 'Reject', page: 'quote', remark: true },
      { key: 'setStatus', label: 'Change Status', page: 'quote', remark: true, statuses: LEAD_STATUSES, from: LEAD_STATUSES },
    ],
  },
  target: {
    label: 'Target', title: 'Target', page: 'target', prefix: 'TGT', pad: 5, initial: 'Active', docLabel: 'Target No.', decorate: 'target',
    fields: [
      f('employee', 'Employee', 'ref', { ref: 'profile', req: 1 }), f('month', 'Month', 'select', { opts: MONTHS, req: 1 }), f('year', 'Year', 'number', { req: 1 }),
      f('type', 'Type', 'select', { opts: ['Sale Amount', 'Sale Qty', 'Collection'], req: 1 }), f('targetValue', 'Target Value', 'number', { req: 1 }), f('remark', 'Remark', 'textarea', { full: 1 }),
    ],
    cols: ['docNo', 'employee', 'month', 'year', 'type', 'targetValue', 'status'], filters: ['month', 'type'],
    unique: ['employee', 'month', 'year', 'type'],
  },
  pjp: {
    label: 'PJP Master', title: 'PJP Master', page: 'pjp', prefix: 'PJP', pad: 4, initial: 'Active',
    fields: [
      f('name', 'PJP Name', 'text', { req: 1 }), f('fromDate', 'PJP From', 'date', { req: 1 }), f('toDate', 'PJP To', 'date', { req: 1 }),
      f('assignedTo', 'Assigned To', 'ref', { ref: 'profile' }), f('locations', 'Locations', 'multiref', { ref: 'location', full: 1 }), f('remark', 'Remark', 'textarea', { full: 1 }),
    ],
    cols: ['name', 'fromDate', 'toDate', 'createdByName', 'createdAt'], dateField: 'fromDate', validate: 'dateRange:fromDate:toDate',
  },
  beat: {
    label: 'Beat Plan', title: 'My Beat Plan', page: 'beat_sched', selfPage: 'my_beat', initial: 'Scheduled', ownerField: 'assignedTo',
    fields: [
      f('assignedTo', 'Assigned To', 'ref', { ref: 'profile' }), f('date', 'Date', 'date', { req: 1 }),
      f('task', 'Task Name', 'select', { opts: ['Collection', 'Dealer Visit', 'Feedback', 'Sale Order'], req: 1 }), f('area', 'Area To Visit', 'text', { req: 1 }), f('remark', 'Remark', 'textarea', { full: 1 }),
    ],
    cols: ['date', 'assignedTo', 'task', 'area', 'status'], filters: ['task'], dateField: 'date',
    actions: [
      { key: 'visit', label: 'Mark Visited', from: ['Scheduled'], to: 'Visited', page: 'my_beat', remark: false, owner: true },
      { key: 'miss', label: 'Mark Missed', from: ['Scheduled'], to: 'Missed', page: 'beat_sched', remark: true },
    ],
    extraActions: ['deviate'],
  },
  deviation: {
    label: 'Deviation Request', title: 'Deviation Request / Deviation Approval', page: 'deviation', selfPage: 'my_beat', approvePage: 'deviation', initial: 'Pending', noCreate: true,
    fields: [f('beat', 'Beat', 'ref', { ref: 'beat' }), f('scheduledDate', 'Scheduled Date', 'date'), f('scheduledVisit', 'Scheduled Visit'), f('changeVisit', 'Change Visit', 'text', { req: 1 }), f('requestRemark', 'Request Remark', 'textarea', { req: 1, full: 1 })],
    cols: ['createdByName', 'scheduledDate', 'scheduledVisit', 'changeVisit', 'createdAt', 'requestRemark', 'status'], dateField: 'scheduledDate',
    actions: approve('deviation'), onApprove: 'deviation',
  },

  /* ───────── General Query ───────── */
  expense: {
    label: 'Locationwise Expense', title: 'Locationwise Expense', page: 'expense', prefix: 'EXP', pad: 5, initial: 'Booked', docLabel: 'Doc No.', locationField: 'location',
    fields: [
      f('location', 'Location', 'ref', { ref: 'location', req: 1 }), f('amount', 'Amount', 'number', { req: 1, min: 0.01 }), f('expenseDate', 'Expense Date', 'date', { req: 1 }),
      f('paymentMode', 'Payment Mode', 'select', { opts: ['Cash', 'Bank', 'UPI', 'Card', 'Other'], req: 1 }), f('narration', 'Narration', 'textarea', { full: 1 }), f('attachment', 'Attachment (URL)', 'url'),
    ],
    cols: ['docNo', 'location', 'amount', 'expenseDate', 'narration', 'status', 'paymentMode'], filters: ['location'], dateField: 'expenseDate', noEdit: true,
  },
  query: {
    label: 'Query / Feedback', title: 'Query / Feedback Master', page: 'query', prefix: 'QRY', pad: 5, initial: 'Open', docLabel: 'Doc No.',
    fields: [
      f('module', 'Module', 'select', { opts: ['PO', 'Invoice', 'Payment', 'Return', 'Stock', 'Master', 'Report', 'Other'], req: 1 }),
      f('problemType', 'Problem Type', 'select', { opts: ['Bug', 'Data Issue', 'Question', 'Feedback'], req: 1 }), f('problem', 'Problem / Feedback', 'textarea', { req: 1, full: 1 }), f('dueDate', 'Due Date', 'date'),
    ],
    cols: ['docNo', 'module', 'problemType', 'problem', 'dueDate', 'createdByName', 'status'], dateField: 'dueDate', noEdit: true,
    actions: [
      { key: 'reply', label: 'Reply', from: ['Open', 'Replied'], to: 'Replied', page: 'query', remark: true },
      { key: 'close', label: 'Close', from: ['Open', 'Replied'], to: 'Closed', page: 'query', remark: false },
    ],
  },

  /* ───────── App transactions ───────── */
  appfeedback: {
    label: 'App Feedback', title: 'App Feedback', page: 'app_feedback', initial: 'Received', noEdit: true, dateField: 'date',
    fields: [
      f('feedbackType', 'Feedback Type', 'select', { opts: ['Complaints', 'General', 'Query'], req: 1 }), f('subject', 'Subject', 'text', { req: 1 }),
      f('feedback', 'Feedback', 'textarea', { req: 1, full: 1 }), f('address', 'Location'), f('imageUrl', 'Image (URL)', 'url'), f('date', 'Date', 'date'),
    ],
    cols: ['feedbackType', 'subject', 'feedback', 'createdByName', 'createdAt', 'address', 'imageUrl'], filters: ['feedbackType'],
  },
  apptask: {
    label: 'App Task', title: 'App Task', page: 'app_task', initial: 'Pending', dateField: 'date',
    fields: [
      f('taskName', 'Task Name', 'text', { req: 1 }), f('subject', 'Task Subject', 'text', { req: 1 }), f('details', 'Task Details', 'textarea', { full: 1 }),
      f('assignedTo', 'Assigned To', 'ref', { ref: 'profile', req: 1 }), f('date', 'Date', 'date'),
    ],
    cols: ['taskName', 'subject', 'details', 'assignedTo', 'status', 'createdByName', 'createdAt'], filters: ['assignedTo'], statusFilter: ['Pending', 'Open', 'In-Progress', 'Done'],
    actions: [{ key: 'setStatus', label: 'Update Status', page: 'app_task', remark: false, owner: true, statuses: ['Pending', 'Open', 'In-Progress', 'Done'], from: ['Pending', 'Open', 'In-Progress'] }],
    ownerField: 'assignedTo', selfPage: 'my_beat', // the field user the task is assigned to sees and updates it (mobile app)
  },
  track: {
    label: 'Track Location', title: 'Track Location', page: 'app_track', selfPage: 'app_track', initial: 'Logged', noEdit: true, dateField: 'travelDate',
    fields: [f('address', 'Address', 'text', { req: 1 }), f('lat', 'Latitude', 'number'), f('lng', 'Longitude', 'number'), f('travelDate', 'Travel Date', 'date'), f('travelTime', 'Travel Time', 'text')],
    cols: ['createdByName', 'address', 'travelDate', 'travelTime'],
  },
  attendance: {
    label: 'Attendance', title: 'Report/Attendance Master', page: 'attendance_report', selfPage: 'e_attendance', noCreate: true, noEdit: true, initial: 'Present', dateField: 'date',
    fields: [f('date', 'Date'), f('employeeName', 'Employee Name'), f('inAt', 'In Time'), f('inAddress', 'IN Address'), f('inImage', 'IN Image'), f('outAt', 'OUT Time'), f('outAddress', 'OUT Address'), f('outImage', 'OUT Image')],
    cols: ['employeeName', 'inAt', 'inAddress', 'inImage', 'outAt', 'outAddress', 'outImage'],
  },
  tada: {
    label: 'TA DA', title: 'TA DA Approval', page: 'tada_approval', selfPage: 'e_tada', approvePage: 'tada_approval', prefix: 'TADA', pad: 5, initial: 'Pending', docLabel: 'Ref. No.', dateField: 'date',
    fields: [
      f('date', 'Date', 'date', { req: 1 }), f('fromPlace', 'From Place', 'text', { req: 1 }), f('toPlace', 'To Place', 'text', { req: 1 }), f('distanceKm', 'Distance (km)', 'number'),
      f('travelAmount', 'Travel Amount', 'number', { req: 1, min: 0 }), f('daAmount', 'DA Amount', 'number', { min: 0 }), f('remark', 'Remark', 'textarea', { full: 1 }),
    ],
    cols: ['createdByName', 'docNo', 'createdAt', 'amount', 'status'], computed: 'tada', actions: approve('tada_approval'),
  },

  /* ───────── HRMS ───────── */
  department: { label: 'Department Master', title: 'Department Master', page: 'hr_department', global: 1, fields: [f('name', 'Department Name', 'text', { req: 1 }), STATUS], cols: ['name', 'createdAt', 'status'], unique: ['name'] },
  designation: { label: 'Designation Master', title: 'Designation Master', page: 'hr_designation', global: 1, fields: [f('name', 'Designation Name', 'text', { req: 1 }), STATUS], cols: ['name', 'createdAt', 'status'], unique: ['name'] },
  holiday: {
    label: 'Holiday Master', title: 'Holiday Master', page: 'hr_holiday', global: 1, dateField: 'date',
    fields: [f('date', 'Date', 'date', { req: 1 }), f('description', 'Description', 'text', { req: 1 }), STATUS], cols: ['date', 'description', 'status'], unique: ['date'],
  },
  leavetype: {
    label: 'Leave Master', title: 'Leave Master', page: 'hr_leave_master', global: 1,
    fields: [
      f('typeOfLeave', 'Type of Leave', 'text', { req: 1 }), f('noOfDays', 'No. of Days (per year)', 'number', { req: 1, min: 0 }),
      f('employmentType', 'Employment Type', 'select', { opts: ['All', 'Permanent', 'Contract', 'Probation', 'Intern'], def: 'All' }), f('effectiveDate', 'Effective Date', 'date'), STATUS,
    ],
    cols: ['typeOfLeave', 'noOfDays', 'employmentType', 'effectiveDate', 'status'], unique: ['typeOfLeave'],
  },
  employee: {
    label: 'Employee Master', title: 'Employee Master', page: 'hr_employee', selfPage: 'e_profile', global: 1, prefix: 'EMP', pad: 4, docLabel: 'Employee Id', ownerField: 'loginId', ownerRaw: 1,
    fields: [
      f('name', 'Emp. Name', 'text', { req: 1 }), f('loginId', 'DMS Login ID (links self-service pages)'), f('email', 'Email', 'email'), f('phone', 'Phone', 'tel', { req: 1 }),
      f('gender', 'Gender', 'select', { opts: ['Male', 'Female', 'Other'] }), f('dob', 'Date of Birth', 'date'), f('joiningDate', 'Joining Date', 'date', { req: 1 }),
      f('department', 'Department', 'ref', { ref: 'department' }), f('designation', 'Designation', 'ref', { ref: 'designation' }), f('location', 'Location', 'ref', { ref: 'location' }),
      f('manager', 'Manager', 'ref', { ref: 'employee' }), f('employmentType', 'Employment Type', 'select', { opts: ['Permanent', 'Contract', 'Probation', 'Intern'], def: 'Permanent' }),
      f('city', 'City'), f('state', 'State'), f('basicSalary', 'Basic Salary (monthly)', 'number', { min: 0 }), f('hra', 'HRA', 'number', { min: 0 }), f('allowances', 'Other Allowances', 'number', { min: 0 }),
      f('pfPercent', 'PF % (on basic)', 'number', { min: 0 }), STATUS, f('address', 'Address', 'textarea', { full: 1 }),
    ],
    cols: ['docNo', 'name', 'city', 'state', 'location', 'status'], filters: ['department', 'designation'], unique: ['loginId'],
  },
  leave: {
    label: 'Leave', title: 'Leave', page: 'hr_leave_approve', selfPage: 'e_leave', approvePage: 'hr_leave_approve', initial: 'Pending', dateField: 'fromDate', computed: 'leave', validate: 'dateRange:fromDate:toDate',
    fields: [f('leaveType', 'Type of Leave', 'ref', { ref: 'leavetype', req: 1 }), f('fromDate', 'From Date', 'date', { req: 1 }), f('toDate', 'To Date', 'date', { req: 1 }), f('purpose', 'Purpose', 'textarea', { req: 1, full: 1 })],
    cols: ['createdByName', 'leaveType', 'fromDate', 'toDate', 'duration', 'purpose', 'status'], statusFilter: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    actions: [...approve('hr_leave_approve'), { key: 'cancel', label: 'Cancel', from: ['Pending'], to: 'Cancelled', page: 'e_leave', remark: false, owner: true }],
  },
  application: {
    label: 'Application', title: 'Application', page: 'hr_application_approve', selfPage: 'e_application', approvePage: 'hr_application_approve', initial: 'Pending',
    fields: [f('type', 'Type', 'select', { opts: ['Loan', 'Visiting Card', 'ID Card'], req: 1 }), f('amount', 'Loan Amount', 'number', { min: 0 }), f('details', 'Details', 'textarea', { req: 1, full: 1 })],
    cols: ['type', 'createdByName', 'createdAt', 'amount', 'status'], filters: ['type'], actions: approve('hr_application_approve'),
  },
  claim: {
    label: 'Claim', title: 'Employee Claims', page: 'hr_claims', selfPage: 'e_claims', approvePage: 'hr_claim_approve', prefix: 'CLM', pad: 5, initial: 'Pending', docLabel: 'Claim No.', dateField: 'claimDate',
    fields: [
      f('claimType', 'Claim Type', 'select', { opts: ['Travelling', 'Lodging', 'Food', 'Other'], req: 1 }), f('claimDate', 'Claim Date', 'date', { req: 1 }), f('amount', 'Amount', 'number', { req: 1, min: 0.01 }),
      f('description', 'Description', 'textarea', { req: 1, full: 1 }), f('attachment', 'Attachment (URL)', 'url'),
    ],
    cols: ['createdByName', 'docNo', 'claimType', 'claimDate', 'amount', 'status'], filters: ['claimType'], actions: approve('hr_claim_approve'),
  },
  activity: {
    label: 'Activities', title: 'Activities', page: 'hr_activities', selfPage: 'e_activities', prefix: 'ACT', pad: 5, initial: 'Open', docLabel: 'Activity No', dateField: 'startDate',
    fields: [f('description', 'Activity Description', 'textarea', { req: 1, full: 1 }), f('startDate', 'Start Date', 'date', { req: 1 })],
    cols: ['docNo', 'description', 'startDate', 'status'],
    actions: [{ key: 'complete', label: 'Mark Completed', from: ['Open'], to: 'Completed', page: 'e_activities', remark: false, owner: true }],
  },
  notice: {
    label: 'Notice', title: 'Notice', page: 'hr_notice', global: 1,
    fields: [f('subject', 'Subject', 'text', { req: 1 }), f('body', 'Notice', 'textarea', { req: 1, full: 1 }), f('fileUrl', 'Download (URL)', 'url'), STATUS],
    cols: ['subject', 'createdByName', 'createdAt', 'status', 'fileUrl'],
  },
  policy: {
    label: 'Policies', title: 'Policies', page: 'hr_policies', selfPage: 'e_policies', global: 1,
    fields: [f('policyName', 'Policy Name', 'text', { req: 1 }), f('releaseDate', 'Release Date', 'date', { req: 1 }), f('content', 'Policy', 'textarea', { full: 1 }), f('fileUrl', 'Document (URL)', 'url'), STATUS],
    cols: ['releaseDate', 'policyName', 'createdByName', 'status'], dateField: 'releaseDate',
  },
  project: {
    label: 'Projects / Clients', title: 'Project / Clients', page: 'hr_projects', global: 1, prefix: 'PRJ', pad: 4, docLabel: 'Project Id', dateField: 'entryDate',
    fields: [
      f('project', 'Project', 'text', { req: 1 }), f('client', 'Client', 'text', { req: 1 }), f('manager', 'Manager', 'ref', { ref: 'employee' }),
      f('entryDate', 'Entry Date', 'date'), f('tentativeDate', 'Tentative Date', 'date'), f('status', 'Status', 'select', { opts: ['Active', 'Completed', 'Deactive'], def: 'Active' }),
    ],
    cols: ['docNo', 'project', 'entryDate', 'client', 'manager', 'tentativeDate', 'status'],
  },
  resign: {
    label: 'Resign Request', title: 'Resign Request', page: 'hr_resign', selfPage: 'e_resign', approvePage: 'hr_resign', initial: 'Pending', dateField: 'lastWorkingDate',
    fields: [f('reason', 'Reason', 'text', { req: 1 }), f('reasonDetails', 'Reason Details', 'textarea', { req: 1, full: 1 }), f('lastWorkingDate', 'Offer Last Working Date', 'date', { req: 1 }), f('resignDoc', 'Resign Document (URL)', 'url')],
    cols: ['createdByName', 'reason', 'lastWorkingDate', 'createdAt', 'status'], actions: approve('hr_resign'),
  },
  mydoc: {
    label: 'My Documents', title: 'My Documents', page: 'e_documents', selfPage: 'e_documents', initial: 'Active',
    fields: [f('fileName', 'File Name', 'text', { req: 1 }), f('fileUrl', 'File (URL)', 'url', { req: 1 })], cols: ['fileName', 'createdByName', 'createdAt', 'fileUrl'],
  },
  salary: {
    label: 'Salary Sheet', title: 'Salary Sheet', page: 'hr_salary_sheet', selfPage: 'e_salary', global: 1, noCreate: true, noEdit: true, initial: 'Generated',
    fields: [
      f('employee', 'Employee', 'ref', { ref: 'employee' }), f('month', 'Month'), f('year', 'Year', 'number'), f('workingDays', 'Working Days', 'number'), f('presentDays', 'Present Days', 'number'),
      f('leaveDays', 'Paid Leave Days', 'number'), f('lopDays', 'Loss of Pay Days', 'number'), f('basic', 'Basic', 'number'), f('hra', 'HRA', 'number'), f('allowances', 'Allowances', 'number'),
      f('gross', 'Gross', 'number'), f('pf', 'PF', 'number'), f('lopDeduction', 'LOP Deduction', 'number'), f('bonus', 'Bonus', 'number'), f('otherDeduction', 'Other Deduction', 'number'), f('net', 'Net Pay', 'number'),
    ],
    cols: ['employee', 'month', 'year', 'gross', 'net', 'status'], filters: ['employee', 'month', 'year'],
  },
};

/* ─────────────────────────────────────────────────────────────────────────────────────────────
 * Reference wording and fields (read from the live reference list and "Add" pages, 20-Nov-2026).
 * Data field names are kept (seed, reports, mobile app and tests use them); labels, order, options,
 * list columns, buttons and form titles follow the reference. `form: false` keeps a field accepted by
 * the API but off the form; `legacy` keeps older option values valid for existing records.
 * Presentation keys: colLabels, colFormat ({ col: 'dt' }), actionCol ('view' | 'view-edit' | 'edit' |
 * 'view+edit' | 'action' | 'history' | 'view+reply' | 'none'), snoLabel, addLabel, addTitle, submitLabel,
 * dateLabels [from, to], filterLabels, titles { all, mine, approval }, addButtons, formWithList.
 * ───────────────────────────────────────────────────────────────────────────────────────────── */
const CIRCLES = ['EAST', 'NORTH', 'SOUTH', 'WEST'];
const keep = (n, l, t, x = {}) => f(n, l, t, { form: false, ...x });
const fileF = (n, l, x = {}) => f(n, l, 'file', x);
const REFERENCE_UI = {
  lead: {
    fields: [
      f('partyName', 'Party Name(Customer)', 'text', { req: 1 }), f('salesExecutive', 'Sales Executive', 'ref', { ref: 'profile' }),
      f('circle', 'Circle', 'select', { opts: CIRCLES }), f('state', 'State', 'ref', { ref: 'state' }), f('area', 'City', 'text', { req: 1 }),
      f('address', 'Party Address', 'textarea'), f('priority', 'Priority', 'select', { opts: ['Cold', 'Warm', 'Hot'], legacy: ['High', 'Medium', 'Low'], def: 'Warm', req: 1 }),
      f('remark', 'Remark', 'textarea'), f('transferTo', 'Transfer To', 'ref', { ref: 'employee' }),
      fileF('visitingCard', 'Attach Visiting Card(Allowed jpg, png, gif, jpeg and Upload upto 2 MB)'),
      f('source', 'Lead Source', 'select', { opts: ['Phone', 'Email', 'Call', 'Newspaper', 'Media'], legacy: ['Walk-in', 'Referral', 'Website', 'Cold Call', 'Exhibition', 'Other'] }),
      keep('contactPerson', 'Contact Person'), keep('phone', 'Phone', 'tel'), keep('email', 'Email', 'email'), keep('expectedValue', 'Expected Value', 'number'), keep('followUpDate', 'Follow-up Date', 'date'),
    ],
    cols: ['docNo', 'partyName', 'priority', 'createdAt', 'status'], colLabels: { partyName: 'Party Name', createdAt: 'Create Date' }, actionCol: 'action',
    filters: [], dateField: undefined, addLabel: 'Add Lead', addTitle: 'Add New Lead',
  },
  quote: {
    fields: [
      f('partyName', 'Party Name(Customer)', 'text', { req: 1 }), f('salesExecutive', 'Sales Executive', 'ref', { ref: 'profile' }),
      f('circle', 'Circle', 'select', { opts: CIRCLES }), f('state', 'State', 'ref', { ref: 'state' }), f('area', 'City'),
      f('referenceNo', 'Reference No'), f('address', 'Party Address', 'textarea'), f('remark', 'Remark', 'textarea'),
      f('lines', 'Items', 'lines', { req: 1, full: 1, tax: 1 }), keep('lead', 'Lead', 'ref', { ref: 'lead' }), keep('validTill', 'Valid Till', 'date'),
    ],
    cols: ['docNo', 'createdByName', 'partyName', 'createdAt', 'status'], colLabels: { createdByName: 'Sales Executive', partyName: 'Party Name', createdAt: 'Create Date' }, actionCol: 'action',
    addLabel: 'Add Quote', addTitle: 'Add New Quote',
  },
  target: {
    fields: [
      f('month', 'Month', 'select', { opts: MONTHS, req: 1 }), f('year', 'Year', 'number', { req: 1 }), f('employee', 'Employee', 'ref', { ref: 'profile', req: 1 }),
      f('type', 'Target Type', 'select', { opts: ['Qty', 'Value'], legacy: ['Sale Amount', 'Sale Qty', 'Collection'], req: 1 }), STATUS,
      f('remark', 'Remark', 'textarea'), f('targetValue', 'Target Value', 'number', { req: 1 }),
      f('products', 'Products', 'grid', { full: 1, cols: [{ n: 'product', l: 'Product', t: 'product', req: 1 }, { n: 'qty', l: 'Qty', t: 'number', req: 1 }] }),
    ],
    cols: ['docNo', 'employee', 'month', 'year', 'type', 'status'], colLabels: { employee: 'Emp Name', type: 'Type' }, actionCol: 'view', filters: [],
    addLabel: 'Add Target', addTitle: 'Add Target', submitLabel: 'Add',
  },
  pjp: {
    fields: [
      f('name', 'PJP Name', 'text', { req: 1 }), f('fromDate', 'Start Date', 'date', { req: 1 }), f('toDate', 'End Date', 'date', { req: 1 }),
      f('tasks', 'Task', 'multiselect', { opts: ['Collection', 'Dealer Visit', 'Feedback', 'Sale Order'] }), f('team', 'Team', 'multiref', { ref: 'profile' }),
      keep('assignedTo', 'Assigned To', 'ref', { ref: 'profile' }), keep('locations', 'Locations', 'multiref', { ref: 'location' }), keep('remark', 'Remark', 'textarea'),
    ],
    cols: ['name', 'fromDate', 'toDate', 'createdByName', 'createdAt'], colLabels: { fromDate: 'Start Date', toDate: 'End Date', createdAt: 'Entry Date' },
    snoLabel: '#', actionCol: 'view', dateLabels: ['PJP From', 'PJP To'], addLabel: 'Add PJP', addTitle: 'Add PJP',
  },
  expense: {
    fields: [
      f('location', 'Location', 'ref', { ref: 'location', req: 1 }), f('expenseDate', 'Expense Date', 'date', { req: 1 }), f('narration', 'Narration', 'textarea'),
      fileF('attachment', 'Attachment (Upload upto 2 MB)'), f('amount', 'Amount', 'number', { req: 1, min: 0.01 }),
      f('status', 'Status', 'select', { opts: ['Pending', 'Paid'], legacy: ['Booked'], def: 'Pending' }),
      f('paymentMode', 'Payment Mode', 'select', { opts: ['Cash', 'Cheque', 'Bank Transfer'], legacy: ['Bank', 'UPI', 'Card', 'Other'], req: 1 }),
      f('transactionId', 'Transcation Id / Ref No.'), f('bankName', 'Bank Name'), f('bankAccountNo', 'Bank Account No.'), f('bankBranch', 'Bank Branch'),
      f('ifsc', 'IFSC Code'), f('modeOfTransfer', 'Mode of Transfer'), f('chequeNo', 'Cheque No.'), f('chequeDate', 'Cheque Date', 'date'),
    ],
    cols: ['docNo', 'location', 'amount', 'expenseDate', 'narration', 'status', 'paymentMode', 'attachment'], colLabels: { attachment: 'Attachment' }, snoLabel: '#', actionCol: 'view',
    addLabel: 'Add New Expense', addTitle: 'Add New Expense',
  },
  query: {
    fields: [
      f('module', 'Module Problem', 'select', { opts: ['Serial No.', 'Sale', 'Dealer', 'MD', 'Report', 'Sales', 'Return'], legacy: ['PO', 'Invoice', 'Payment', 'Stock', 'Master', 'Other'], req: 1 }),
      f('problemType', 'Problem Type', 'select', { opts: ['Complaint', 'General', 'Query'], legacy: ['Bug', 'Data Issue', 'Question', 'Feedback'], req: 1 }),
      f('problem', 'Request / Feedback', 'textarea', { req: 1, full: 1 }), fileF('attachment', 'Attach Images (Allowed jpg, png, gif,GIF,JPEG,PNG and Upload upto 2 MB)'),
      f('phone', 'Contact Number', 'tel'), keep('dueDate', 'Due Date', 'date'),
    ],
    cols: ['docNo', 'module', 'problemType', 'problem', 'dueDate', 'createdByName'], colLabels: { module: 'Module', problem: 'Problem / Feedback' },
    snoLabel: '#', actionCol: 'view+reply', addLabel: 'Add New Query / Feedback', addTitle: 'Add New Query / Feedback',
  },
  appfeedback: {
    cols: ['feedbackType', 'subject', 'feedback', 'createdByName', 'createdAt', 'address', 'imageUrl'],
    colLabels: { createdByName: 'Updated By', createdAt: 'Updated Date', address: 'View Location', imageUrl: 'Image' }, snoLabel: 'S.No.', actionCol: 'none',
    dateLabels: ['Feedback From', 'Feedback To'],
  },
  apptask: {
    fields: [
      f('taskName', 'Task Name', 'text', { req: 1 }), f('subject', 'Task Subject', 'text', { req: 1 }), f('details', 'Task Details', 'textarea', { full: 1 }),
      f('status', 'Status', 'select', { opts: ['Pending', 'In-Progress', 'Open', 'Done'], def: 'Pending' }),
      f('userType', 'Assign User Type', 'select', { opts: ['Admin', 'Sales Head', 'Regional Sales Head', 'State Head', 'Area Sales Manager', 'Territory Sales Manager', 'Sales Executive', 'Location User', 'ISP/ISD', 'Director', 'Employee'] }),
      f('assignedTo', 'Assign To', 'ref', { ref: 'profile', req: 1 }), keep('date', 'Date', 'date'),
    ],
    cols: ['taskName', 'subject', 'details', 'assignedTo', 'status', 'createdByName', 'createdAt'], colLabels: { assignedTo: 'Assigned To', createdAt: 'Entry Date' }, snoLabel: '#',
    actionCol: 'history', dateLabels: ['Task From', 'Task To'], filterLabels: { assignedTo: 'Task By', status: 'Task Status' }, addLabel: 'Add Task', addTitle: 'Add Task',
  },
  track: { cols: ['createdByName', 'address', 'travelDate', 'travelTime'], colLabels: { createdByName: 'Eng Id' }, snoLabel: '#', actionCol: 'none' },
  attendance: { snoLabel: null, actionCol: 'none', filters: ['employeeName'] },
  tada: { colLabels: { createdByName: 'Sales Executive', createdAt: 'Entry Date & Time' }, colFormat: { createdAt: 'dt' }, actionCol: 'view' },
  department: {
    fields: [f('name', 'Department Name', 'text', { req: 1 }), STATUS],
    colLabels: { createdAt: 'Create Date & Time' }, colFormat: { createdAt: 'dt' }, actionCol: 'view-edit', addLabel: 'Add Department', addTitle: 'Add Department',
  },
  designation: {
    fields: [f('name', 'Designation Name', 'text', { req: 1 }), STATUS],
    colLabels: { createdAt: 'Create Date & Time' }, colFormat: { createdAt: 'dt' }, actionCol: 'view-edit', addLabel: 'Add Designation', addTitle: 'Add Designation',
  },
  holiday: {
    fields: [f('date', 'Date', 'date', { req: 1 }), f('description', 'Description', 'textarea', { req: 1 }), STATUS],
    actionCol: 'view-edit', addLabel: 'Add Holiday', addTitle: 'Add Holiday',
  },
  leavetype: {
    fields: [
      f('typeOfLeave', 'Type of Leave', 'text', { req: 1 }), f('noOfDays', 'No. of Days', 'number', { req: 1, min: 0 }), f('effectiveDate', 'Effetcive Date', 'date'), // reference spelling
      f('employmentType', 'Employment Type', 'select', { opts: ['Bench', 'On Notice Period', 'Permanent', 'Probation', 'Stipend', 'Training'], legacy: ['All', 'Contract', 'Intern'] }), STATUS,
    ],
    colLabels: { effectiveDate: 'Effective Date' }, actionCol: 'view-edit', addLabel: 'Add Leave', addTitle: 'Add Leave',
  },
  employee: {
    fields: [
      f('name', 'Employee Name', 'text', { req: 1 }), f('circle', 'Region/Circle', 'select', { opts: CIRCLES }), f('state', 'State'), f('city', 'City'),
      f('fatherName', 'Father Name'), f('motherName', 'Mother Name'), f('email', 'Email', 'email'), f('phone', 'Contact Number', 'tel', { req: 1 }),
      f('email2', 'Alternate Email', 'email'), f('phone2', 'Alternate Mo. Number', 'tel'), f('dob', 'DOB', 'date'),
      f('gender', 'Gender', 'select', { opts: ['Male', 'Female'], legacy: ['Other'] }), f('maritalStatus', 'Marital Status', 'select', { opts: ['Married', 'Unmarried'] }),
      f('marriageDate', 'Marriage Date', 'date'), f('jobType', 'Job Type', 'select', { opts: ['Full Time', 'Part Time', 'Permanent', 'Contractual'] }),
      f('empType', 'Employee Type', 'select', { opts: ['Employee', 'Manager'] }), f('address', 'Present Address', 'textarea'), f('permanentAddress', 'Permanent Address', 'textarea'),
      STATUS, f('location', 'Mapped Location', 'ref', { ref: 'location' }), f('emergencyPerson', 'Emergency Contact Person'), f('emergencyPhone', 'Emergency Contact No.', 'tel'),
      f('emergencyRelation', 'Emergency Contact Relation'), f('pincode', 'Pincode'), f('remark', 'Remark', 'textarea'),
      // payroll / self-service data used by Salary Generate and the employee pages
      f('loginId', 'DMS Login ID (links self-service pages)'), f('joiningDate', 'Date of Joining', 'date', { req: 1 }), f('department', 'Department', 'ref', { ref: 'department' }),
      f('designation', 'Designation', 'ref', { ref: 'designation' }), f('manager', 'Reporting Manager', 'ref', { ref: 'employee' }),
      f('employmentType', 'Employment Type', 'select', { opts: ['Permanent', 'Contract', 'Probation', 'Intern'], def: 'Permanent' }),
      f('basicSalary', 'Basic Salary (monthly)', 'number', { min: 0 }), f('hra', 'HRA', 'number', { min: 0 }), f('allowances', 'Other Allowances', 'number', { min: 0 }), f('pfPercent', 'PF % (on basic)', 'number', { min: 0 }),
    ],
    cols: ['docNo', 'name', 'city', 'state', 'locationType', 'status'], colLabels: { name: 'Emp. Name', locationType: 'Location Type' }, snoLabel: '#', actionCol: 'view-edit',
    addLabel: 'Add New Employee', addTitle: 'Add Employee',
  },
  leave: {
    fields: [
      f('leaveType', 'Type of Leave', 'ref', { ref: 'leavetype', req: 1 }), f('durationOfLeave', 'Duration Of Leave', 'select', { opts: ['Full Day', 'Half Day'], def: 'Full Day' }),
      f('fromDate', 'From Date', 'date', { req: 1 }), f('toDate', 'To Date', 'date', { req: 1 }), f('purpose', 'Purpose', 'text', { req: 1 }), f('description', 'Description', 'textarea'),
    ],
    colLabels: { createdByName: 'Emp. Name' }, actionCol: 'view', addLabel: 'Leave Apply', addTitle: 'Leave Apply',
    titles: { mine: 'Leave apply / View Status', approval: 'Leave Approve', all: 'Leave Approve' },
  },
  application: {
    fields: [
      f('type', 'Type', 'select', { opts: ['Loan', 'Visiting Card', 'ID Card'], req: 1 }), f('empNo', 'Employee No.'), f('empName', 'Employee Name'), f('designationName', 'Designation'),
      f('mobile', 'Mobile No.', 'tel'), f('emailId', 'Email ID.', 'email'), f('doj', 'Date of Joining', 'date'), f('amount', 'Requested Amount', 'number', { min: 0 }),
      f('details', 'Remark', 'textarea', { req: 1, full: 1 }),
    ],
    cols: ['type', 'createdByName', 'createdAt', 'status'], colLabels: { createdByName: 'Apply By', createdAt: 'Request Date' }, actionCol: 'view', filters: [],
    modeCols: { approval: { cols: ['createdByName', 'type', 'empManager', 'createdAt', 'status'], colLabels: { createdByName: 'Emp Name', type: 'Task', empManager: 'Manager', createdAt: 'Entry Date' }, actionCol: 'action' } },
    addButtons: [{ label: 'New Loan', q: { type: 'Loan' } }, { label: 'New Visiting Card', q: { type: 'Visiting Card' } }, { label: 'New ID Card', q: { type: 'ID Card' } }],
    addTitle: 'Apply For', submitLabel: 'Apply', titles: { mine: 'Application', approval: 'Application Approve', all: 'Application Approve' },
  },
  claim: {
    fields: [
      f('empCode', 'Employee Code'), f('claimType', 'Claim Type', 'select', { opts: ['LOCAL', 'OUTSTATION'], legacy: ['Travelling', 'Lodging', 'Food', 'Other'], req: 1 }),
      f('claimDate', 'Claim Date', 'date', { req: 1 }), f('description', 'Remark', 'textarea', { req: 1, full: 1 }),
      f('travel', 'Travelling', 'grid', { full: 1, sumTo: 'amount', sumCol: 'amt', cols: [{ n: 'date', l: 'Date', t: 'date', req: 1 }, { n: 'from', l: 'From' }, { n: 'to', l: 'To' }, { n: 'km', l: 'K.M.', t: 'number' }, { n: 'mode', l: 'Mode', t: 'select', opts: ['Bike', 'Bus', 'Car', 'Metro', 'Taxi'] }, { n: 'purpose', l: 'Purpose' }, { n: 'amt', l: 'Amt', t: 'number', req: 1 }] }),
      f('fooding', 'Fooding', 'grid', { full: 1, sumTo: 'amount', sumCol: 'amt', cols: [{ n: 'date', l: 'Date', t: 'date', req: 1 }, { n: 'remark', l: 'Remark' }, { n: 'amt', l: 'Amt', t: 'number', req: 1 }] }),
      fileF('attachment', 'Have you any attachment file?'), keep('amount', 'Amount', 'number', { min: 0 }),
    ],
    cols: ['createdByName', 'empDesignation', 'empManager', 'docNo', 'claimDate', 'status'], colLabels: { createdByName: 'Emp Name', empDesignation: 'Designation', empManager: 'Manager' }, actionCol: 'view', filters: [],
    modeCols: { approval: { cols: ['docNo', 'createdByName', 'claimType', 'empManager', 'createdAt', 'status'], colLabels: { docNo: 'Claim ID', createdByName: 'Emp Name', claimType: 'Task', empManager: 'Manager', createdAt: 'Entry Date' }, actionCol: 'action' } },
    addLabel: 'Add Claim', addTitle: 'Add Claim', titles: { approval: 'Claim Approvals', all: 'Employee Claims', mine: 'Employee Claims' },
  },
  activity: {
    fields: [f('activityName', 'Activity'), f('description', 'Activity Details', 'textarea', { req: 1, full: 1 }), fileF('attachment', 'Attachment'), f('startDate', 'Start Date', 'date')],
    cols: ['docNo', 'description', 'startDate'], colLabels: { description: 'Activity Description' }, actionCol: 'view-edit', addLabel: 'Add Activities', addTitle: 'Add Activity',
  },
  notice: {
    fields: [f('subject', 'Subject', 'text', { req: 1 }), f('body', 'Message', 'textarea', { req: 1, full: 1 }), fileF('fileUrl', 'Notice Doc.'), STATUS],
    cols: ['subject', 'createdByName', 'createdAt', 'status', 'fileUrl'], colLabels: { createdAt: 'Entry Date', fileUrl: 'Download' }, actionCol: 'edit',
    addLabel: 'Add Notice', addTitle: 'Add Notice',
  },
  policy: {
    fields: [
      f('policyName', 'Subject', 'text', { req: 1 }), f('content', 'Message', 'textarea', { full: 1 }),
      f('policyType', 'Policy Type', 'select', { opts: ['Awards & Recognition', 'Benefit Plan', 'Other'] }), f('releaseDate', 'Release Date', 'date', { req: 1 }),
      fileF('fileUrl', 'Policy Document'), STATUS,
    ],
    colLabels: { policyName: 'Policy Name', createdByName: 'Create By' }, actionCol: 'view', addLabel: 'Add Policy', addTitle: 'Add Policy', submitLabel: 'Request',
  },
  project: {
    fields: [
      f('project', 'Project Name', 'text', { req: 1 }), f('description', 'Description', 'textarea'), f('tentativeDate', 'Tentative Date', 'date'),
      f('client', 'Client Name', 'text', { req: 1 }), f('clientMobile', 'Client Mobile', 'tel'), f('clientEmail', 'Client Email', 'email'),
      f('manager', 'Manager', 'ref', { ref: 'employee' }), f('status', 'Status', 'select', { opts: ['Active', 'Deactive'], legacy: ['Completed'], def: 'Active' }), keep('entryDate', 'Entry Date', 'date'),
    ],
    cols: ['docNo', 'project', 'createdAt', 'client', 'manager', 'tentativeDate', 'status'], colLabels: { project: 'Project', createdAt: 'Entry Date', client: 'Client' },
    actionCol: 'view-edit', addLabel: 'Add Project', addTitle: 'Add Project',
  },
  resign: {
    fields: [f('reason', 'Reason', 'text', { req: 1 }), f('reasonDetails', 'Reason Details', 'textarea', { req: 1, full: 1 }), f('lastWorkingDate', 'Offer Last Working Date', 'date', { req: 1 }), fileF('resignDoc', 'Resign Document')],
    formWithList: true, submitLabel: 'Request', actionCol: 'view',
  },
  mydoc: {
    fields: [f('fileName', 'Doc. Name', 'text', { req: 1 }), fileF('fileUrl', 'Attached Document', { req: 1 })],
    colLabels: { fileName: 'File Name', createdByName: 'Enter By', createdAt: 'Enter Date', fileUrl: 'Download' }, actionCol: 'none',
    addLabel: 'Add Document', addTitle: 'Add Document', submitLabel: 'Upload',
  },
};
for (const [k, o] of Object.entries(REFERENCE_UI)) Object.assign(ENTITY_TYPES[k], o);

/** Which pages exist per type (for the page-right catalogue). */
export const ENTITY_PAGES = [...new Set(Object.values(ENTITY_TYPES).flatMap((c) => [c.page, c.selfPage, c.approvePage].filter(Boolean)))];

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
    actions: [{ key: 'setStatus', label: 'Update Status', page: 'app_task', remark: false, statuses: ['Pending', 'Open', 'In-Progress', 'Done'], from: ['Pending', 'Open', 'In-Progress'] }],
    ownerField: 'assignedTo',
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

/** Which pages exist per type (for the page-right catalogue). */
export const ENTITY_PAGES = [...new Set(Object.values(ENTITY_TYPES).flatMap((c) => [c.page, c.selfPage, c.approvePage].filter(Boolean)))];

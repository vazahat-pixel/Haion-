import Report from '../../models/Report.model.js';
import { getReportDefinition, getCatalogForUser, getCatalogCategories } from './reportRegistry.js';
import { GENERATORS, setReportContext } from './generators.js';
import { parseDateRange, formatPeriodLabel } from './dateRange.util.js';

export async function runReport({ reportCode, fromDate, toDate, user, save = true }) {
  const dealerId = user.dealerId || null;
  const definition = getReportDefinition(reportCode);
  if (!definition) {
    const err = new Error(`Unknown report: ${reportCode}`);
    err.statusCode = 400;
    throw err;
  }

  if (dealerId && definition.scope === 'admin') {
    const err = new Error('This report is only available for company admin');
    err.statusCode = 403;
    throw err;
  }

  const generator = GENERATORS[reportCode];
  if (!generator) {
    const err = new Error(`Report generator not implemented: ${reportCode}`);
    err.statusCode = 501;
    throw err;
  }

  const range = parseDateRange(fromDate, toDate);
  setReportContext({ dealerId });
  let data;
  try {
    data = await generator(range);
  } finally {
    setReportContext({});
  }

  if (data?.meta) {
    data.meta.dealerScoped = Boolean(dealerId);
  }

  if (!save) {
    return { data, definition, period: formatPeriodLabel(range.from, range.to) };
  }

  const author = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  const summaryText = data.summary
    ? Object.entries(data.summary).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ')
    : definition.title;

  const doc = await Report.create({
    title: definition.title,
    type: definition.category,
    reportCode,
    periodFrom: range.from,
    periodTo: range.to,
    period: formatPeriodLabel(range.from, range.to),
    author,
    authorUser: user._id,
    dealer: dealerId || undefined,
    status: 'COMPLETED',
    summary: summaryText,
    data,
  });

  return doc.toObject();
}

export function getCatalog(user = {}) {
  const reports = getCatalogForUser({ dealerId: user.dealerId });
  return {
    reports,
    categories: getCatalogCategories(reports),
  };
}
